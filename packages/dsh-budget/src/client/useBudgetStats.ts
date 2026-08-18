import { useSyncExternalStore } from 'react'
import { EMPTY_STATS, type ClientStats } from './model.ts'

let snapshot: ClientStats = EMPTY_STATS
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined
let inFlight = false

function emit(): void {
  for (const listener of listeners) listener()
}

async function pull(): Promise<void> {
  if (inFlight) return
  inFlight = true
  try {
    const response = await fetch('/dsh-budget/stats', { cache: 'no-store' })
    if (!response.ok) return
    snapshot = (await response.json()) as ClientStats
    emit()
  } catch {
    /* route missing until dsh web restarts with the plugin */
  } finally {
    inFlight = false
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (listeners.size === 1) {
    void pull()
    timer = setInterval(() => void pull(), 2000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
  }
}

export function useBudgetStats(): ClientStats {
  return useSyncExternalStore(subscribe, () => snapshot)
}
