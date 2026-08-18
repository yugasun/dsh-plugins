import { AUTO_PROVIDER_ORDER, type Config } from './config.ts'
import type { EnvLookup } from './env.ts'
import { firstEnv } from './env.ts'
import { firstNonEmpty, isPositiveInteger, isValidBaseUrl } from './errors.ts'
import { BUILTIN_SEAM_PROVIDER_ID, SEAM_PROVIDER_ID, type PluginStatus, type ProviderId, type ProviderStatus } from './types.ts'

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
      return isValidBaseUrl(config.baiduBaseURL) && config.baiduModel.trim().length > 0
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
    searchProvider: config.searchProvider,
    active: config.customSearch !== false ? selectActive(config, secrets) : null,
    providers,
  }
}
