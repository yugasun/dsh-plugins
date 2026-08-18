import { useSyncExternalStore } from 'react'
import type { SettingsScope } from './model.ts'

export function useSettingsScope<T>(scope: SettingsScope<T>) {
  return useSyncExternalStore(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot(),
  )
}
