export type SearchProviderChoice = 'auto' | 'baidu' | 'doubao' | 'tavily' | 'exa'
export type ProviderId = 'baidu' | 'doubao' | 'tavily' | 'exa'
export type FetchProviderChoice = 'auto' | 'http' | 'tavily' | 'exa'
export type FetchProviderId = 'tavily' | 'exa'

export interface ClientConfig {
  customSearch: boolean
  searchProvider: SearchProviderChoice
  fetchProvider: FetchProviderChoice
  baiduApiKey: string
  baiduBaseURL: string
  baiduModel: string
  doubaoApiKey: string
  doubaoBaseURL: string
  doubaoModel: string
  tavilyApiKey: string
  tavilyBaseURL: string
  tavilySearchDepth: 'basic' | 'advanced' | 'fast' | 'ultra-fast'
  tavilyExtractDepth: 'basic' | 'advanced'
  exaApiKey: string
  exaBaseURL: string
  exaSearchType: 'auto' | 'keyword' | 'neural'
  exaProviderId: string
  exaHighlightsPerResult: number
}

export interface ProviderStatus {
  id: ProviderId
  available: boolean
  configured: boolean
}

export interface PluginStatus {
  customSearch: boolean
  seamProvider: 'dsh-web-search' | 'deepseek-official'
  fetchProvider: 'dsh-web-search' | 'http'
  searchProvider: SearchProviderChoice
  fetchChoice: FetchProviderChoice
  active: ProviderId | null
  activeFetch: FetchProviderId | null
  providers: ProviderStatus[]
}

export interface ProbeResult {
  ok: boolean
  provider: ProviderId
  sources?: number
  error?: string
  code?: string
}

export interface SettingsScope<T> {
  getSnapshot(): { status: string; value: T | undefined; writable: boolean }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
}

export const EMPTY_STATUS: PluginStatus = {
  customSearch: true,
  seamProvider: 'dsh-web-search',
  fetchProvider: 'http',
  searchProvider: 'auto',
  fetchChoice: 'auto',
  active: null,
  activeFetch: null,
  providers: [
    { id: 'baidu', available: false, configured: false },
    { id: 'doubao', available: false, configured: false },
    { id: 'tavily', available: false, configured: false },
    { id: 'exa', available: false, configured: false },
  ],
}

export const PROVIDER_OPTIONS: Array<{ id: SearchProviderChoice; labelKey: string }> = [
  { id: 'auto', labelKey: 'auto' },
  { id: 'baidu', labelKey: 'baidu' },
  { id: 'doubao', labelKey: 'doubao' },
  { id: 'tavily', labelKey: 'tavily' },
  { id: 'exa', labelKey: 'exa' },
]

export const FETCH_OPTIONS: Array<{ id: FetchProviderChoice; labelKey: string }> = [
  { id: 'auto', labelKey: 'fetchAuto' },
  { id: 'http', labelKey: 'fetchHttp' },
  { id: 'tavily', labelKey: 'tavily' },
  { id: 'exa', labelKey: 'exa' },
]
