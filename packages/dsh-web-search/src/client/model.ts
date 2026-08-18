export type SearchProviderChoice = 'auto' | 'baidu' | 'doubao' | 'tavily' | 'exa'
export type ProviderId = 'baidu' | 'doubao' | 'tavily' | 'exa'

export interface ClientConfig {
  customSearch: boolean
  searchProvider: SearchProviderChoice
  baiduApiKey: string
  baiduBaseURL: string
  baiduModel: string
  doubaoApiKey: string
  doubaoBaseURL: string
  doubaoModel: string
  tavilyApiKey: string
  tavilyBaseURL: string
  tavilySearchDepth: 'basic' | 'advanced' | 'fast' | 'ultra-fast'
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
  searchProvider: SearchProviderChoice
  active: ProviderId | null
  providers: ProviderStatus[]
}

export interface SettingsScope<T> {
  getSnapshot(): { status: string; value: T | undefined; writable: boolean }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
}

export const EMPTY_STATUS: PluginStatus = {
  customSearch: true,
  seamProvider: 'dsh-web-search',
  searchProvider: 'auto',
  active: null,
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
