import type {
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '@deepseek-ai/dsh-web'

export type { WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource }

export const PROVIDER_IDS = ['baidu', 'doubao', 'tavily', 'exa'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]
export type SearchProviderChoice = 'auto' | ProviderId

/** Id registered on `ctx.web`. Pinned when custom search is on. */
export const SEAM_PROVIDER_ID = 'dsh-web-search'
/** Official DSH search provider. Pinned when custom search is off. */
export const BUILTIN_SEAM_PROVIDER_ID = 'deepseek-official'

export interface ProviderStatus {
  id: ProviderId
  available: boolean
  /** True when an API key is present in settings or the environment. */
  configured: boolean
}

export interface PluginStatus {
  customSearch: boolean
  seamProvider: typeof SEAM_PROVIDER_ID | typeof BUILTIN_SEAM_PROVIDER_ID
  searchProvider: SearchProviderChoice
  active: ProviderId | null
  providers: ProviderStatus[]
}

export const USER_AGENT = 'dsh-web-search/0.1.0'
