import type { RequestPlan } from './planner.ts'

export interface BudgetCapsView {
  enabled: boolean
  toolResultMaxTokens: number
}

export interface BudgetStats {
  lastPlan: RequestPlan | null
  savedTokens: number
  spillCount: number
  caps: BudgetCapsView | null
  postSeen: number
  postTrimmed: number
  postSkipped: number
  lastSkip: string | null
  updatedAt: number | null
}

export class StatsStore {
  lastPlan: RequestPlan | null = null
  savedTokens = 0
  spillCount = 0
  caps: BudgetCapsView | null = null
  postSeen = 0
  postTrimmed = 0
  postSkipped = 0
  lastSkip: string | null = null
  updatedAt: number | null = null

  touch(): void {
    this.updatedAt = Date.now()
  }

  noteCaps(caps: BudgetCapsView): void {
    this.caps = {
      enabled: caps.enabled,
      toolResultMaxTokens: caps.toolResultMaxTokens,
    }
    this.touch()
  }

  notePost(kind: 'trimmed' | 'skipped', reason?: string): void {
    this.postSeen += 1
    if (kind === 'trimmed') this.postTrimmed += 1
    else {
      this.postSkipped += 1
      if (reason) this.lastSkip = reason
    }
    this.touch()
  }

  record(plan: RequestPlan): void {
    this.lastPlan = plan
    this.savedTokens += plan.savedTokens
    this.spillCount += plan.contributors.filter((item) => item.action === 'spill').length
    this.touch()
  }

  snapshot(): BudgetStats {
    return {
      lastPlan: this.lastPlan,
      savedTokens: this.savedTokens,
      spillCount: this.spillCount,
      caps: this.caps,
      postSeen: this.postSeen,
      postTrimmed: this.postTrimmed,
      postSkipped: this.postSkipped,
      lastSkip: this.lastSkip,
      updatedAt: this.updatedAt,
    }
  }
}
