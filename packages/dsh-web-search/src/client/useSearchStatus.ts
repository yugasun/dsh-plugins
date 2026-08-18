import { useCallback, useEffect, useState } from 'react'
import { EMPTY_STATUS, type PluginStatus } from './model.ts'

export function useSearchStatus(): { status: PluginStatus; refresh: () => void } {
  const [status, setStatus] = useState<PluginStatus>(EMPTY_STATUS)

  const refresh = useCallback(() => {
    void fetch('/dsh-web-search/status', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return
        const body = await response.json() as PluginStatus
        setStatus(body)
      })
      .catch(() => {
        // The route is missing until the plugin HTTP fiber attaches.
      })
  }, [])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, 4000)
    return () => window.clearInterval(timer)
  }, [refresh])

  return { status, refresh }
}
