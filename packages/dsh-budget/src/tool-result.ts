import { estimateTokens } from './estimate.ts'
import { planRequest, type BudgetCaps, type PlannedContributor, type RequestPlan } from './planner.ts'
import { shrinkToTokens } from './text.ts'

export function spillNotice(omittedTokens: number, locator: string, hint: string): string {
  return `(dsh-budget: omitted ~${omittedTokens} tokens. Full result stored at: ${locator}. ${hint} Do not re-read the original file just to recover this text.)`
}

export function budgetToolText(
  text: string,
  caps: BudgetCaps,
  key = 'tool-result',
): {
  plan: RequestPlan
  item: PlannedContributor | undefined
  next: string
} {
  const plan = planRequest(
    [{ key, tokens: estimateTokens(text), lifetime: 'step', kind: 'tool-result' }],
    caps,
  )
  const item = plan.contributors[0]
  if (!item || item.action === 'keep') return { plan, item, next: text }
  return { plan, item, next: shrinkToTokens(text, item.afterTokens) }
}

export function budgetToolTextWithNotice(
  text: string,
  caps: BudgetCaps,
  key: string,
  locator: string,
  hint: string,
): {
  plan: RequestPlan
  item: PlannedContributor | undefined
  next: string
} {
  const trimmed = budgetToolText(text, caps, key)
  if (!trimmed.item || trimmed.item.action === 'keep') return trimmed
  const omitted = Math.max(0, trimmed.item.tokens - trimmed.item.afterTokens)
  const notice = spillNotice(omitted, locator, hint)
  const bodyBudget = Math.max(256, trimmed.item.afterTokens - estimateTokens(notice))
  return {
    ...trimmed,
    next: `${shrinkToTokens(text, bodyBudget)}\n\n${notice}`,
  }
}
