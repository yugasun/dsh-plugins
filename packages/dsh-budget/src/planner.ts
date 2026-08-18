export type ContributorAction = 'keep' | 'spill'
export type ContributorLifetime = 'step'

export interface Contributor {
  key: string
  tokens: number
  lifetime: ContributorLifetime
  kind?: 'tool-result'
}

export interface BudgetCaps {
  enabled: boolean
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

function clone(item: Contributor): PlannedContributor {
  return {
    ...item,
    action: 'keep',
    afterTokens: item.tokens,
  }
}

/** Cap each tool result independently. History and system text are out of scope. */
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
    if (item.kind !== 'tool-result' && !item.key.startsWith('tool-result')) continue
    if (item.tokens <= caps.toolResultMaxTokens) continue
    item.action = 'spill'
    item.afterTokens = caps.toolResultMaxTokens
    item.reason = `tool result ${item.tokens} > ${caps.toolResultMaxTokens}`
    reasons.push(item.reason)
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
