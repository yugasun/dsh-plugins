import { failOpen } from '../fail-open.ts'
import type { Config } from '../config.ts'
import type { StatsStore } from '../stats.ts'
import type { HostContext, PostToolDecision, SpillStore, ToolExec, ToolResult } from '../host-types.ts'
import { acceptedPlainText, budgetAcceptedText, flattenPlainText, skipReason } from './tool-content.ts'

function ownerSessionId(exec: ToolExec): string | undefined {
  const id = exec.agent?.session?.header?.id
  return typeof id === 'string' ? id : undefined
}

export function registerPostExecute(
  ctx: HostContext,
  source: () => Config,
  stats: StatsStore,
): void {
  ctx.on(
    'tools/post-execute',
    (async (
      exec: ToolExec,
      result: ToolResult,
      next: () => Promise<PostToolDecision>,
    ): Promise<PostToolDecision> => {
      const decision = await next()
      const config = source()
      stats.noteCaps(config)
      return failOpen(
        async () => {
          if (!config.enabled) return decision
          const text = acceptedPlainText(decision, result.content)
          if (text === undefined) {
            stats.notePost('skipped', skipReason(decision, result.content) ?? 'unknown')
            return decision
          }

          const key = `tool-result:${exec.name}`
          const spillStore = ctx.get('spillStore') as SpillStore | undefined
          const sessionId = ownerSessionId(exec)
          let spill
          if (spillStore && sessionId && exec.callId) {
            const preview = budgetAcceptedText(text, config, key)
            if (preview) {
              try {
                spill = await spillStore.saveText({
                  owner: { sessionId },
                  source: { toolName: exec.name, callId: exec.callId, label: 'result' },
                  suggestedName: `${exec.name}.txt`,
                  content: text,
                })
              } catch (error) {
                ctx.logger?.warn(`dsh-budget: spill failed for ${exec.name}: ${String(error)}`)
              }
            }
          }

          const trimmed = budgetAcceptedText(text, config, key, spill)
          if (!trimmed) {
            stats.notePost('skipped', 'under-cap')
            return decision
          }

          stats.notePost('trimmed')
          stats.record(trimmed.plan)
          ctx.logger?.info?.(
            `dsh-budget: trimmed ${exec.name} ${trimmed.plan.beforeTokens}→${trimmed.plan.afterTokens} (−${trimmed.plan.savedTokens})`,
          )
          return {
            kind: 'accept',
            content: [{ type: 'text', text: trimmed.next }],
            ...(decision.additionalContexts
              ? { additionalContexts: decision.additionalContexts }
              : {}),
          }
        },
        decision,
        (error) => ctx.logger?.warn(`dsh-budget post-execute: ${String(error)}`),
        config.failOpen,
      )
    }) as never,
    { prepend: true },
  )

  // Code Mode logs inner tool results on a separate waterfall. Official
  // spill-policy caps that copy at 50KB; our token cap is often tighter.
  ctx.on(
    'tools/code-dispatch-log',
    (async (
      dispatch: { name: string },
      next: () => Promise<Array<{ type: string; text?: string }>>,
    ) => {
      const content = await next()
      const config = source()
      return failOpen(
        async () => {
          if (!config.enabled) return content
          const text = flattenPlainText(content)
          if (text === undefined) return content
          const trimmed = budgetAcceptedText(text, config, `tool-result:${dispatch.name}`)
          if (!trimmed) return content
          return [{ type: 'text', text: trimmed.next }]
        },
        content,
        (error) => ctx.logger?.warn(`dsh-budget code-dispatch-log: ${String(error)}`),
        config.failOpen,
      )
    }) as never,
    { prepend: true },
  )
}
