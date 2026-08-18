import type { RequestPlan } from './planner.ts'

export interface BudgetCapsView {
  enabled: boolean
  maxInputTokens: number
  toolResultMaxTokens: number
}

export interface BudgetStats {
  lastPlan: RequestPlan | null
  savedTokens: number
  spillCount: number
  summarizeCount: number
  surfaceTokens: number
  shrinkableTokens: number
  caps: BudgetCapsView | null
  postSeen: number
  postTrimmed: number
  postSkipped: number
  lastSkip: string | null
  pruneAttempts: number
  pruneLanded: number
  lastError: string | null
  updatedAt: number | null
}

export class StatsStore {
  lastPlan: RequestPlan | null = null
  savedTokens = 0
  spillCount = 0
  summarizeCount = 0
  surfaceTokens = 0
  shrinkableTokens = 0
  caps: BudgetCapsView | null = null
  postSeen = 0
  postTrimmed = 0
  postSkipped = 0
  lastSkip: string | null = null
  pruneAttempts = 0
  pruneLanded = 0
  lastError: string | null = null
  updatedAt: number | null = null

  touch(): void {
    this.updatedAt = Date.now()
  }

  noteCaps(caps: BudgetCapsView): void {
    this.caps = {
      enabled: caps.enabled,
      maxInputTokens: caps.maxInputTokens,
      toolResultMaxTokens: caps.toolResultMaxTokens,
    }
    this.touch()
  }

  observe(surfaceTokens: number, shrinkableTokens = this.shrinkableTokens): void {
    this.surfaceTokens = Math.max(0, Math.round(surfaceTokens))
    this.shrinkableTokens = Math.max(0, Math.round(shrinkableTokens))
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

  notePrune(attempts: number, landed: number, error?: string | null): void {
    this.pruneAttempts += attempts
    this.pruneLanded += landed
    if (error) this.lastError = error
    this.touch()
  }

  record(plan: RequestPlan): void {
    this.lastPlan = plan
    this.savedTokens += plan.savedTokens
    this.spillCount += plan.contributors.filter((item) => item.action === 'spill').length
    this.summarizeCount += plan.contributors.filter((item) => item.action === 'summarize').length
    this.touch()
  }

  snapshot(): BudgetStats {
    return {
      lastPlan: this.lastPlan,
      savedTokens: this.savedTokens,
      spillCount: this.spillCount,
      summarizeCount: this.summarizeCount,
      surfaceTokens: this.surfaceTokens,
      shrinkableTokens: this.shrinkableTokens,
      caps: this.caps,
      postSeen: this.postSeen,
      postTrimmed: this.postTrimmed,
      postSkipped: this.postSkipped,
      lastSkip: this.lastSkip,
      pruneAttempts: this.pruneAttempts,
      pruneLanded: this.pruneLanded,
      lastError: this.lastError,
      updatedAt: this.updatedAt,
    }
  }
}
