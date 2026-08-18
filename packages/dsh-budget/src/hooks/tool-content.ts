import type { Config } from '../config.ts'
import type { RequestPlan } from '../planner.ts'
import { budgetToolText, budgetToolTextWithNotice } from '../tool-result.ts'
import type { ContentBlock, PostToolDecision, SpillRef } from '../host-types.ts'

const TEXTISH = new Set(['text', 'reasoning'])

function asBlocks(value: unknown): ContentBlock[] | undefined {
  return Array.isArray(value) ? (value as ContentBlock[]) : undefined
}

/** Unwrap `tool-result` wrappers and concatenate text; skip mixed rich content. */
export function flattenPlainText(content: ContentBlock[] | undefined): string | undefined {
  if (!content) return undefined
  let text = ''
  for (const block of content) {
    if (block.type === 'tool-result') {
      const inner = flattenPlainText(asBlocks(block.content))
      if (inner === undefined) return undefined
      text += inner
      continue
    }
    if (block.type !== 'text') return undefined
    text += block.text ?? ''
  }
  return text
}

/** All model-visible text, including reasoning and tool-result wrappers. */
export function flattenTextish(content: ContentBlock[] | undefined): string {
  if (!content) return ''
  let text = ''
  for (const block of content) {
    if (block.type === 'tool-result') {
      text += flattenTextish(asBlocks(block.content))
      continue
    }
    if (TEXTISH.has(block.type)) text += block.text ?? ''
  }
  return text
}

/** Official post-execute may replace `value` or `content`, never both. */
export function isRewritableAccept(decision: PostToolDecision): boolean {
  return decision.kind === 'accept' && !Object.hasOwn(decision, 'value')
}

export function acceptedPlainText(decision: PostToolDecision, content: ContentBlock[] | undefined): string | undefined {
  if (!isRewritableAccept(decision)) return undefined
  return flattenPlainText(decision.content ?? content)
}

export function skipReason(decision: PostToolDecision, content: ContentBlock[] | undefined): string | undefined {
  if (decision.kind !== 'accept') return `decision:${decision.kind}`
  if (Object.hasOwn(decision, 'value')) return 'value-replacement'
  if (flattenPlainText(decision.content ?? content) === undefined) return 'non-text'
  return undefined
}

export function budgetAcceptedText(
  text: string,
  config: Config,
  key: string,
  spill?: SpillRef,
): { next: string; plan: RequestPlan } | undefined {
  const trimmed = spill
    ? budgetToolTextWithNotice(text, config, key, spill.locator, spill.retrievalHint)
    : budgetToolText(text, config, key)
  if (!trimmed.item || trimmed.item.action === 'keep') return undefined
  return { next: trimmed.next, plan: trimmed.plan }
}
