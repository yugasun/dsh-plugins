export type ContributorAction = 'keep' | 'summarize' | 'spill' | 'drop'
export type ContributorLifetime = 'profile' | 'session' | 'turn' | 'step'

export interface Contributor {
  key: string
  tokens: number
  lifetime: ContributorLifetime
  /** System / identity content that must stay inline. */
  required?: boolean
  kind?: 'system' | 'tools' | 'history' | 'tool-result' | 'other'
}

export interface BudgetCaps {
  enabled: boolean
  maxInputTokens: number
  toolResultMaxTokens: number
}

export interface PlannedContributor extends Contributor {
  action: ContributorAction
  afterTokens: number
  reason?: string
}

export interface RequestPlan {
  contributors: PlannedContributor[]
  beforeTokens: number
  afterTokens: number
  savedTokens: number
  reasons: string[]
}

const TOOL_RESULT_KINDS = new Set(['tool-result'])

function isToolResult(item: Contributor): boolean {
  return item.kind === 'tool-result' || item.key.startsWith('tool-result')
}

function clone(item: Contributor): PlannedContributor {
  return {
    ...item,
    action: 'keep',
    afterTokens: item.tokens,
  }
}

/**
 * Assign keep/spill/summarize/drop to each contributor.
 * Order: identity when disabled; cap tool results; then cut remaining
 * overage from tool results first, then history. Required items stay.
 */
export function planRequest(contributors: Contributor[], caps: BudgetCaps): RequestPlan {
  const planned = contributors.map(clone)
  const reasons: string[] = []

  if (!caps.enabled) {
    const beforeTokens = planned.reduce((sum, item) => sum + item.tokens, 0)
    return {
      contributors: planned,
      beforeTokens,
      afterTokens: beforeTokens,
      savedTokens: 0,
      reasons: ['budget disabled'],
    }
  }

  for (const item of planned) {
    if (item.required) continue
    if (!isToolResult(item) && item.kind !== undefined && !TOOL_RESULT_KINDS.has(item.kind)) continue
    if (!isToolResult(item)) continue
    if (item.tokens <= caps.toolResultMaxTokens) continue
    item.action = 'spill'
    item.afterTokens = caps.toolResultMaxTokens
    item.reason = `tool result ${item.tokens} > ${caps.toolResultMaxTokens}`
    reasons.push(item.reason)
  }

  const total = () => planned.reduce((sum, item) => sum + item.afterTokens, 0)
  let over = total() - caps.maxInputTokens

  const cut = (item: PlannedContributor, action: ContributorAction, next: number, reason: string) => {
    const saved = item.afterTokens - next
    if (saved <= 0) return 0
    item.action = item.action === 'keep' ? action : item.action === 'spill' ? 'spill' : action
    item.afterTokens = next
    item.reason = reason
    reasons.push(reason)
    return saved
  }

  if (over > 0) {
    for (const item of planned) {
      if (over <= 0) break
      if (item.required) continue
      if (!isToolResult(item)) continue
      const target = Math.min(item.afterTokens, caps.toolResultMaxTokens)
      const floor = Math.min(target, Math.max(64, item.afterTokens - over))
      over -= cut(item, item.action === 'spill' ? 'spill' : 'summarize', floor, `total budget; shrink ${item.key}`)
    }
  }

  if (over > 0) {
    for (const item of planned) {
      if (over <= 0) break
      if (item.required) continue
      if (item.kind === 'history' || item.key.startsWith('history')) {
        const floor = Math.min(item.afterTokens, Math.max(32, item.afterTokens - over))
        over -= cut(item, 'summarize', floor, `total budget; shrink history ${item.key}`)
      }
    }
  }

  const beforeTokens = planned.reduce((sum, item) => sum + item.tokens, 0)
  const afterTokens = planned.reduce((sum, item) => sum + item.afterTokens, 0)
  return {
    contributors: planned,
    beforeTokens,
    afterTokens,
    savedTokens: Math.max(0, beforeTokens - afterTokens),
    reasons,
  }
}
