export interface ClientConfig {
  enabled: boolean
  toolResultMaxTokens: number
  failOpen: boolean
}

export interface ClientPlan {
  beforeTokens: number
  afterTokens: number
  savedTokens: number
}

export interface ClientStats {
  lastPlan: ClientPlan | null
  savedTokens: number
  spillCount: number
  caps?: { enabled: boolean; toolResultMaxTokens: number } | null
  postSeen?: number
  postTrimmed?: number
  postSkipped?: number
  lastSkip?: string | null
  updatedAt: number | null
}

export interface SettingsScope<T> {
  getSnapshot(): { status: string; value: T | undefined; writable: boolean }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
}

export const EMPTY_STATS: ClientStats = {
  lastPlan: null,
  savedTokens: 0,
  spillCount: 0,
  updatedAt: null,
}

export function formatTokens(value: number): string {
  if (value >= 10_000) return `${Math.round(value / 1000)}k`
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(Math.round(value))
}

export function formatBytes(value: number): string {
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${value} B`
}
