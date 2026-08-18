import { estimateTokens } from '../estimate.ts'
import { failOpen } from '../fail-open.ts'
import type { Config } from '../config.ts'
import { planRequest, type Contributor } from '../planner.ts'
import type { StatsStore } from '../stats.ts'
import { shrinkToTokens } from '../text.ts'
import type {
  ContentBlock,
  HostContext,
  SessionLike,
  TokenMeter,
  UserMessage,
} from '../host-types.ts'
import { enforceSurfaceBudget } from './surface-prune.ts'

interface PreStepPayload {
  agent: {
    session?: SessionLike
    inject?: (message: UserMessage) => void
  }
  messages: UserMessage[]
  turn: number
  step: number
}

interface PreStepDecision {
  kind: 'reject' | 'enter'
  messages?: UserMessage[]
}

function messageText(message: UserMessage): string {
  return (message.content ?? [])
    .filter((block): block is ContentBlock & { text: string } => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('')
}

function rewriteMessage(message: UserMessage, afterTokens: number): UserMessage {
  const text = messageText(message)
  if (estimateTokens(text) <= afterTokens) return message
  const next = shrinkToTokens(text, afterTokens)
  return {
    ...message,
    content: [{ type: 'text', text: next }],
  }
}

export function registerPreStep(
  ctx: HostContext,
  source: () => Config,
  stats: StatsStore,
): void {
  ctx.on(
    'agent/pre-step',
    (async (
      payload: PreStepPayload,
      next: () => Promise<PreStepDecision>,
    ): Promise<PreStepDecision> => {
      const config = source()
      stats.noteCaps(config)
      if (config.enabled) {
        await failOpen(
          async () => {
            const session = payload.agent.session
            const meter = ctx.get('tokenMeter') as TokenMeter | undefined
            let pruned = {
              count: 0,
              plan: null as ReturnType<typeof enforceSurfaceBudget>['plan'],
              attempts: 0,
              lastError: null as string | null,
              shrinkableTokens: 0,
            }
            if (session?.surface) {
              pruned = enforceSurfaceBudget(session, config, meter)
              stats.notePrune(pruned.attempts, pruned.count, pruned.lastError)
              if (pruned.plan) {
                stats.record(pruned.plan)
                ctx.logger?.info?.(
                  `dsh-budget: pruned ${pruned.count} surface messages (−${pruned.plan.savedTokens})`,
                )
              } else if (pruned.lastError) {
                ctx.logger?.warn?.(`dsh-budget: surface replace failed: ${pruned.lastError}`)
              }
            }
            try {
              if (meter && session) {
                const measured = meter.measure(session)
                const surface = measured.surfaceTokens ?? measured.totalTokens ?? 0
                stats.observe(surface, pruned.shrinkableTokens)
                if (surface > config.maxInputTokens && !pruned.plan) {
                  ctx.logger?.warn?.(
                    `dsh-budget: surface ${surface} > ${config.maxInputTokens} shrinkable=${pruned.shrinkableTokens} attempts=${pruned.attempts}`,
                  )
                }
              }
            } catch {
              /* occupancy is advisory */
            }
          },
          undefined,
          (error) => ctx.logger?.warn(`dsh-budget surface prune: ${String(error)}`),
          config.failOpen,
        )
      }

      const decision = await next()
      return failOpen(
        async () => {
          if (!config.enabled) return decision
          if (decision.kind !== 'enter' || !decision.messages) return decision

          const messages = decision.messages
          const claimedTokens = messages.reduce((sum, message) => sum + estimateTokens(messageText(message)), 0)
          const meter = ctx.get('tokenMeter') as TokenMeter | undefined
          let surfaceTokens = claimedTokens
          try {
            if (meter && payload.agent.session) {
              const measured = meter.measure(payload.agent.session)
              surfaceTokens = measured.surfaceTokens ?? measured.totalTokens ?? claimedTokens
            }
          } catch {
            surfaceTokens = claimedTokens
          }

          const contributors: Contributor[] = [
            {
              key: 'session-surface',
              tokens: Math.max(0, surfaceTokens - claimedTokens),
              lifetime: 'session',
              kind: 'other',
              required: true,
            },
            ...messages.map((message, index) => {
              const toolResult = message.source?.kind === 'tool' || message.role === 'tool'
              return {
                key: toolResult ? `tool-result:history:${index}` : `history:${index}`,
                tokens: estimateTokens(messageText(message)),
                lifetime: 'turn' as const,
                kind: (toolResult ? 'tool-result' : 'history') as 'tool-result' | 'history',
              }
            }),
          ]

          const plan = planRequest(contributors, config)
          const rewritten = messages.map((message, index) => {
            const item = plan.contributors.find(
              (entry) => entry.key === `history:${index}` || entry.key === `tool-result:history:${index}`,
            )
            if (!item || item.action === 'keep') return message
            return rewriteMessage(message, item.afterTokens)
          })

          if (plan.savedTokens > 0) {
            stats.record(plan)
            const summary = `dsh-budget: ${plan.beforeTokens}→${plan.afterTokens} tokens (−${plan.savedTokens})`
            try {
              payload.agent.inject?.({
                role: 'user',
                content: [{ type: 'text', text: `${summary}. ${plan.reasons.slice(0, 3).join('; ')}` }],
                source: {
                  kind: 'plugin',
                  plugin: 'dsh-budget',
                  form: 'notice',
                  summary,
                },
              })
            } catch (error) {
              ctx.logger?.warn(`dsh-budget inject failed: ${String(error)}`)
            }
          }

          return { kind: 'enter', messages: rewritten }
        },
        decision,
        (error) => ctx.logger?.warn(`dsh-budget pre-step: ${String(error)}`),
        config.failOpen,
      )
    }) as never,
    { prepend: true },
  )
}
