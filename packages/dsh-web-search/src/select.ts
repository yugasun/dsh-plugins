import { AUTO_FETCH_ORDER, AUTO_PROVIDER_ORDER, baiduSearchModeOf, type Config } from './config.ts'
import type { EnvLookup } from './env.ts'
import { firstEnv } from './env.ts'
import { firstNonEmpty, isPositiveInteger, isValidBaseUrl } from './errors.ts'
import {
  BUILTIN_FETCH_PROVIDER_ID,
  BUILTIN_SEAM_PROVIDER_ID,
  SEAM_PROVIDER_ID,
  type FetchProviderId,
  type PluginStatus,
  type ProviderId,
  type ProviderStatus,
} from './types.ts'

export interface ResolvedSecrets {
  baiduApiKey: string
  doubaoApiKey: string
  tavilyApiKey: string
  exaApiKey: string
}

export const SECRET_ENVS: Record<keyof ResolvedSecrets, readonly string[]> = {
  baiduApiKey: ['BAIDU_API_KEY', 'QIANFAN_API_KEY'],
  doubaoApiKey: ['DOUBAO_API_KEY', 'ARK_API_KEY'],
  tavilyApiKey: ['TAVILY_API_KEY'],
  exaApiKey: ['EXA_API_KEY'],
}

export function resolveSecrets(config: Config, env: EnvLookup): ResolvedSecrets {
  return {
    baiduApiKey: firstNonEmpty(config.baiduApiKey, firstEnv(env, SECRET_ENVS.baiduApiKey)),
    doubaoApiKey: firstNonEmpty(config.doubaoApiKey, firstEnv(env, SECRET_ENVS.doubaoApiKey)),
    tavilyApiKey: firstNonEmpty(config.tavilyApiKey, firstEnv(env, SECRET_ENVS.tavilyApiKey)),
    exaApiKey: firstNonEmpty(config.exaApiKey, firstEnv(env, SECRET_ENVS.exaApiKey)),
  }
}

export function mergeSecrets(base: ResolvedSecrets, overlay: Partial<ResolvedSecrets>): ResolvedSecrets {
  return {
    baiduApiKey: firstNonEmpty(base.baiduApiKey, overlay.baiduApiKey),
    doubaoApiKey: firstNonEmpty(base.doubaoApiKey, overlay.doubaoApiKey),
    tavilyApiKey: firstNonEmpty(base.tavilyApiKey, overlay.tavilyApiKey),
    exaApiKey: firstNonEmpty(base.exaApiKey, overlay.exaApiKey),
  }
}

export const MIN_SECRET_LENGTH = 8

export function providerConfigured(id: ProviderId, secrets: ResolvedSecrets): boolean {
  switch (id) {
    case 'baidu':
      return looksLikeSecret(secrets.baiduApiKey)
    case 'doubao':
      return looksLikeSecret(secrets.doubaoApiKey)
    case 'tavily':
      return looksLikeSecret(secrets.tavilyApiKey)
    case 'exa':
      return looksLikeSecret(secrets.exaApiKey)
  }
}

function looksLikeSecret(value: string): boolean {
  return value.trim().length >= MIN_SECRET_LENGTH
}

export function providerEndpointReady(id: ProviderId, config: Config): boolean {
  switch (id) {
    case 'baidu':
      if (!isValidBaseUrl(config.baiduBaseURL)) return false
      if (baiduSearchModeOf(config) === 'ai') return config.baiduModel.trim().length > 0
      return true
    case 'doubao':
      return isValidBaseUrl(config.doubaoBaseURL) && config.doubaoModel.trim().length > 0
    case 'tavily':
      return isValidBaseUrl(config.tavilyBaseURL)
    case 'exa':
      return isValidBaseUrl(config.exaBaseURL)
        && config.exaProviderId.trim().length > 0
        && isPositiveInteger(config.exaHighlightsPerResult)
  }
}

export function providerUsable(id: ProviderId, config: Config, secrets: ResolvedSecrets): boolean {
  return providerConfigured(id, secrets) && providerEndpointReady(id, config)
}

export function configuredSeamProviderId(config: Config): typeof SEAM_PROVIDER_ID | typeof BUILTIN_SEAM_PROVIDER_ID {
  return config.customSearch !== false ? SEAM_PROVIDER_ID : BUILTIN_SEAM_PROVIDER_ID
}

/** Point `ctx.web` at this plugin or at DSH built-in search. */
export function pinWebSearchProvider(web: { searchProviderId?: string }, config: Config): void {
  web.searchProviderId = configuredSeamProviderId(config)
}

export function isFetchBackend(id: ProviderId | null): id is FetchProviderId {
  return id === 'tavily' || id === 'exa'
}

export function fetchChoiceOf(config: Config): Config['fetchProvider'] {
  return config.fetchProvider ?? 'auto'
}

export function listFetchAvailable(config: Config, secrets: ResolvedSecrets): FetchProviderId[] {
  return AUTO_FETCH_ORDER.filter((id) => providerUsable(id, config, secrets))
}

/**
 * Tavily/Exa page extract, or DSH built-in HTTP.
 * `fetchProvider` is independent of search except when it is `auto`.
 */
export function selectFetchBackend(config: Config, secrets: ResolvedSecrets): FetchProviderId | null {
  if (config.customSearch === false) return null
  const fetchChoice = fetchChoiceOf(config)
  if (fetchChoice === 'http') return null
  if (fetchChoice === 'tavily' || fetchChoice === 'exa') {
    return providerEndpointReady(fetchChoice, config) ? fetchChoice : null
  }
  const active = selectActive(config, secrets)
  if (isFetchBackend(active)) return active
  if (config.searchProvider === 'tavily' || config.searchProvider === 'exa') {
    return providerEndpointReady(config.searchProvider, config) ? config.searchProvider : null
  }
  return null
}

/** Backends the search facade should try, in order. */
export function searchCandidates(config: Config, secrets: ResolvedSecrets): ProviderId[] {
  if (config.searchProvider === 'auto') return listAvailable(config, secrets)
  if (providerUsable(config.searchProvider, config, secrets)) return [config.searchProvider]
  if (providerEndpointReady(config.searchProvider, config)) return [config.searchProvider]
  return []
}

export function searchFailoverEnabled(config: Config): boolean {
  return config.customSearch !== false && config.searchProvider === 'auto'
}

/** Backends the fetch facade should try, in order. */
export function fetchCandidates(config: Config, secrets: ResolvedSecrets): FetchProviderId[] {
  const fetchChoice = fetchChoiceOf(config)
  if (config.customSearch === false || fetchChoice === 'http') return []
  if (fetchChoice === 'tavily' || fetchChoice === 'exa') {
    return [fetchChoice]
  }
  const selected = selectFetchBackend(config, secrets)
  if (selected == null) return []
  if (config.searchProvider === 'auto') {
    return [selected, ...listFetchAvailable(config, secrets).filter((id) => id !== selected)]
  }
  return [selected]
}

export function fetchFailoverEnabled(config: Config): boolean {
  return config.customSearch !== false
    && fetchChoiceOf(config) === 'auto'
    && config.searchProvider === 'auto'
}

export function configuredFetchProviderId(
  config: Config,
  secrets: ResolvedSecrets,
): typeof SEAM_PROVIDER_ID | typeof BUILTIN_FETCH_PROVIDER_ID {
  return selectFetchBackend(config, secrets) !== null ? SEAM_PROVIDER_ID : BUILTIN_FETCH_PROVIDER_ID
}

export function fetchFacadeAvailable(config: Config, secrets: ResolvedSecrets): boolean {
  return selectFetchBackend(config, secrets) !== null
}

export function pinWebFetchProvider(
  web: { fetchProviderId?: string },
  config: Config,
  secrets: ResolvedSecrets,
): void {
  web.fetchProviderId = configuredFetchProviderId(config, secrets)
}

export function pinWebSeams(
  web: { searchProviderId?: string; fetchProviderId?: string },
  config: Config,
  secrets: ResolvedSecrets,
): void {
  pinWebSearchProvider(web, config)
  pinWebFetchProvider(web, config, secrets)
}

/** The facade is selectable when custom search is on and a backend is usable or pinned. */
export function facadeAvailable(config: Config, secrets: ResolvedSecrets): boolean {
  if (config.customSearch === false) return false
  if (selectActive(config, secrets) !== null) return true
  if (config.searchProvider === 'auto') return false
  return providerEndpointReady(config.searchProvider, config)
}

export function listAvailable(config: Config, secrets: ResolvedSecrets): ProviderId[] {
  return AUTO_PROVIDER_ORDER.filter((id) => providerUsable(id, config, secrets))
}

export function selectActive(config: Config, secrets: ResolvedSecrets): ProviderId | null {
  if (config.searchProvider !== 'auto') {
    return providerUsable(config.searchProvider, config, secrets) ? config.searchProvider : null
  }
  return listAvailable(config, secrets)[0] ?? null
}

export function isSelected(id: ProviderId, config: Config, secrets: ResolvedSecrets): boolean {
  return selectActive(config, secrets) === id
}

export function pluginStatus(config: Config, secrets: ResolvedSecrets): PluginStatus {
  const providers: ProviderStatus[] = AUTO_PROVIDER_ORDER.map((id) => ({
    id,
    available: providerUsable(id, config, secrets),
    configured: providerConfigured(id, secrets),
  }))
  return {
    customSearch: config.customSearch !== false,
    seamProvider: configuredSeamProviderId(config),
    fetchProvider: configuredFetchProviderId(config, secrets),
    searchProvider: config.searchProvider,
    fetchChoice: fetchChoiceOf(config),
    active: config.customSearch !== false ? selectActive(config, secrets) : null,
    activeFetch: selectFetchBackend(config, secrets),
    providers,
  }
}
