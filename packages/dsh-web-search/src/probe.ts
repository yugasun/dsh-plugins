import type { WebSearchProvider } from '@deepseek-ai/dsh-web'
import { errorCode } from './failover.ts'
import { providerUsable, type ResolvedSecrets } from './select.ts'
import type { Config } from './config.ts'
import type { ProviderId } from './types.ts'
import { PROVIDER_IDS } from './types.ts'

export const PROBE_QUERY = 'DeepSeek'
export const PROBE_MAX_RESULTS = 1

export interface ProbeResult {
  ok: boolean
  provider: ProviderId
  sources?: number
  error?: string
  code?: string
}

export function parseProbeProvider(value: unknown): ProviderId | undefined {
  if (typeof value !== 'string') return undefined
  return PROVIDER_IDS.find((id) => id === value)
}

export async function probeProvider(
  backends: Record<ProviderId, WebSearchProvider>,
  config: Config,
  secrets: ResolvedSecrets,
  id: ProviderId,
  signal?: AbortSignal,
): Promise<ProbeResult> {
  if (!providerUsable(id, config, secrets)) {
    return {
      ok: false,
      provider: id,
      error: `${id} has no usable API key or endpoint`,
      code: 'WEB_PROVIDER_CREDENTIAL_MISSING',
    }
  }
  try {
    const result = await backends[id].search(
      { query: PROBE_QUERY, maxResults: PROBE_MAX_RESULTS },
      signal,
    )
    return { ok: true, provider: id, sources: result.sources.length }
  } catch (error: unknown) {
    return {
      ok: false,
      provider: id,
      error: error instanceof Error ? error.message : String(error),
      code: errorCode(error),
    }
  }
}
