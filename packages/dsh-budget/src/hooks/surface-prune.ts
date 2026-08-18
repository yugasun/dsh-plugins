import { estimateTokens } from '../estimate.ts'
import type { BudgetCaps, RequestPlan } from '../planner.ts'
import { shrinkToTokens } from '../text.ts'
import type { ContentBlock, SessionEventLike, SessionLike, TokenMeter } from '../host-types.ts'
import { flattenPlainText, flattenTextish } from './tool-content.ts'

export interface SurfacePruneResult {
  count: number
  plan: RequestPlan | null
  attempts: number
  lastError: string | null
  shrinkableTokens: number
}

interface SurfaceItem {
  seq: number
  type: 'user/message' | 'assistant/message' | 'tool/result'
  kind: 'tool-result' | 'history'
  tokens: number
  text: string
  event: SessionEventLike
  rewritable: boolean
}

function cloneJson<T>(value: T): T | undefined {
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return undefined
  }
}

function asBlocks(value: unknown): ContentBlock[] | undefined {
  return Array.isArray(value) ? (value as ContentBlock[]) : undefined
}

export function eventAt(session: SessionLike, seq: number): SessionEventLike | undefined {
  const direct = session.events[seq]
  if (direct && (direct.seq === undefined || direct.seq === seq)) return direct
  return session.events.find((event) => event.seq === seq)
}

function toolResultBlock(event: SessionEventLike): { type?: string; content?: ContentBlock[] } | undefined {
  const block = event.data?.message?.content?.[0]
  return block?.type === 'tool-result' ? block : undefined
}

function extractItem(seq: number, event: SessionEventLike): SurfaceItem | undefined {
  if (event.type === 'user/message') {
    const text = flattenPlainText(asBlocks(event.data?.content) ?? asBlocks(event.data?.message?.content))
    if (text === undefined) return undefined
    return { seq, type: 'user/message', kind: 'history', tokens: estimateTokens(text), text, event, rewritable: true }
  }
  if (event.type === 'assistant/message') {
    const blocks = asBlocks(event.data?.message?.content)
    const text = flattenTextish(blocks)
    if (!text) return undefined
    // Old assistant/message cannot be rewritten in a later step: the session
    // invariant requires the replacement to name the currently open turn/step.
    return { seq, type: 'assistant/message', kind: 'history', tokens: estimateTokens(text), text, event, rewritable: false }
  }
  if (event.type === 'tool/result') {
    const inner = toolResultBlock(event)?.content ?? asBlocks(event.data?.message?.content)
    const text = flattenPlainText(inner)
    if (text === undefined) return undefined
    return { seq, type: 'tool/result', kind: 'tool-result', tokens: estimateTokens(text), text, event, rewritable: true }
  }
  return undefined
}

function userReplacement(item: SurfaceItem, next: string): unknown | undefined {
  const cloned = cloneJson(item.event.data)
  if (!cloned || typeof cloned !== 'object') return undefined
  return { ...cloned, content: [{ type: 'text', text: next }] }
}

/** Official pruner: keep every field except `message.content[0].content`. */
function toolReplacement(item: SurfaceItem, next: string): unknown | undefined {
  const data = item.event.data
  const message = data?.message
  const result = message?.content?.[0]
  if (!message || result?.type !== 'tool-result') return undefined
  return {
    ...data,
    message: {
      ...message,
      content: [
        {
          ...result,
          content: [{ type: 'text', text: next }],
        },
      ],
    },
  }
}

function collapseMessage(tokens: number, count: number): {
  role: 'user'
  id: string
  content: Array<{ type: 'text'; text: string }>
  source: { kind: 'plugin'; plugin: string; form: string; summary: string }
} {
  const text = `[dsh-budget] omitted ${count} earlier messages (~${tokens} tokens) so this request fits the budget.`
  return {
    role: 'user',
    id: `dsh-budget-${Date.now().toString(36)}`,
    content: [{ type: 'text', text }],
    source: {
      kind: 'plugin',
      plugin: 'dsh-budget',
      form: 'notice',
      summary: text,
    },
  }
}

function appendReplace(
  session: SessionLike,
  type: string,
  data: unknown,
  seqs: number[],
  start: number,
  end: number,
  shadowedTokenCount: number,
): void {
  session.append('compaction/prune', {
    shadowedRange: { start, end },
    shadowedSeqs: seqs,
    shadowedTokenCount: Math.max(0, Math.round(shadowedTokenCount)),
  })
  session.append(type, data, {
    surfaceOp: { op: 'replace', start, end },
    sourceEventSeqs: seqs,
  })
}

function collect(session: SessionLike): SurfaceItem[] {
  const nodes = session.surface?.nodes ? [...session.surface.nodes] : []
  const found: SurfaceItem[] = []
  for (const seq of nodes) {
    const event = eventAt(session, seq)
    if (!event) continue
    const item = extractItem(seq, event)
    if (item) found.push(item)
  }
  return found
}

/**
 * Rewrite already-logged surface messages so the next request respects the
 * request budget. Tool results are capped first; remaining overage is taken
 * from older user/tool text. Assistant turns are not rewritten in place
 * (session invariant); if they still blow the cap, a prefix of the surface is
 * replaced with one short notice — the same protocol official compaction uses.
 */
export function enforceSurfaceBudget(
  session: SessionLike,
  caps: BudgetCaps,
  meter?: TokenMeter,
): SurfacePruneResult {
  const empty: SurfacePruneResult = { count: 0, plan: null, attempts: 0, lastError: null, shrinkableTokens: 0 }
  if (!caps.enabled || !session.surface) return empty

  let beforeTokens = 0
  let afterTokens = 0
  let count = 0
  let attempts = 0
  let lastError: string | null = null
  const reasons: string[] = []

  const fail = (error: unknown): false => {
    lastError = error instanceof Error ? error.message : String(error)
    return false
  }

  const apply = (item: SurfaceItem, nextTokens: number, reason: string): number => {
    if (!item.rewritable || nextTokens >= item.tokens) return 0
    const next = shrinkToTokens(item.text, nextTokens)
    const actual = estimateTokens(next)
    if (actual >= item.tokens) return 0
    const data = item.type === 'tool/result' ? toolReplacement(item, next) : userReplacement(item, next)
    if (!data) return 0
    const shadowed = meter?.estimateMessage?.(item.event.data?.message ?? item.event.data) ?? item.tokens
    attempts += 1
    try {
      appendReplace(session, item.type, data, [item.seq], item.seq, item.seq, shadowed)
    } catch (error) {
      fail(error)
      return 0
    }
    beforeTokens += item.tokens
    afterTokens += actual
    count += 1
    reasons.push(reason)
    return item.tokens - actual
  }

  const collapse = (items: SurfaceItem[], reason: string): number => {
    if (items.length === 0) return 0
    const seqs = items.map((item) => item.seq)
    const tokens = items.reduce((sum, item) => sum + item.tokens, 0)
    const data = collapseMessage(tokens, items.length)
    const noticeTokens = estimateTokens(data.content[0]?.text ?? '')
    attempts += 1
    try {
      appendReplace(session, 'user/message', data, seqs, seqs[0]!, seqs[seqs.length - 1]!, tokens)
    } catch (error) {
      fail(error)
      return 0
    }
    beforeTokens += tokens
    afterTokens += noticeTokens
    count += 1
    reasons.push(reason)
    return Math.max(0, tokens - noticeTokens)
  }

  for (const item of collect(session)) {
    if (item.kind !== 'tool-result') continue
    if (item.tokens <= caps.toolResultMaxTokens) continue
    apply(item, caps.toolResultMaxTokens, `surface tool result ${item.tokens} > ${caps.toolResultMaxTokens}`)
  }

  const remaining = collect(session)
  const shrinkableTokens = remaining.filter((item) => item.rewritable).reduce((sum, item) => sum + item.tokens, 0)
  let surfaceTokens = remaining.reduce((sum, item) => sum + item.tokens, 0)
  try {
    if (meter) surfaceTokens = meter.measure(session).surfaceTokens ?? surfaceTokens
  } catch {
    /* occupancy is advisory */
  }
  let over = surfaceTokens - caps.maxInputTokens
  if (over > 0) {
    const rewritable = remaining.filter((item) => item.rewritable)
    const tail = Math.min(2, rewritable.length)
    const cuttable = rewritable.slice(0, Math.max(0, rewritable.length - tail))
    for (const item of cuttable) {
      if (over <= 0) break
      const floor = item.kind === 'tool-result'
        ? Math.min(item.tokens, Math.max(64, Math.min(caps.toolResultMaxTokens, item.tokens - over)))
        : Math.max(32, item.tokens - over)
      over -= apply(item, floor, `total budget; shrink ${item.type}#${item.seq}`)
    }
  }

  if (over > 0) {
    const latest = collect(session)
    const keep = Math.min(2, latest.length)
    const prefix = latest.slice(0, Math.max(0, latest.length - keep))
    if (prefix.length > 0) {
      over -= collapse(prefix, `total budget; replace ${prefix.length} older messages`)
    }
  }

  if (count === 0) {
    return { count: 0, plan: null, attempts, lastError, shrinkableTokens }
  }
  return {
    count,
    attempts,
    lastError,
    shrinkableTokens,
    plan: {
      contributors: Array.from({ length: count }, (_, index) => ({
        key: `surface:${index}`,
        tokens: 0,
        lifetime: 'session' as const,
        kind: 'tool-result' as const,
        action: 'spill' as const,
        afterTokens: 0,
      })),
      beforeTokens,
      afterTokens,
      savedTokens: Math.max(0, beforeTokens - afterTokens),
      reasons,
    },
  }
}

/** @deprecated use {@link enforceSurfaceBudget} */
export function pruneToolResultsOnSurface(
  session: SessionLike,
  capTokens: number,
  meter?: TokenMeter,
): SurfacePruneResult {
  return enforceSurfaceBudget(
    session,
    { enabled: true, toolResultMaxTokens: capTokens, maxInputTokens: Number.MAX_SAFE_INTEGER },
    meter,
  )
}
