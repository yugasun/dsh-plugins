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
  baiduSearchMode: 'web' | 'ai'
  baiduModel: string
  doubaoApiKey: string
  doubaoBaseURL: string
  doubaoSearchMode: 'custom' | 'global'
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

export const VENDOR_ORDER: ProviderId[] = ['baidu', 'doubao', 'tavily', 'exa']

/** Official consoles for creating an API key. */
export const PROVIDER_KEY_URLS: Record<ProviderId, string> = {
  baidu: 'https://console.bce.baidu.com/qianfan/ais/console/apiKey',
  doubao: 'https://console.volcengine.com/search-infinity/api-key',
  tavily: 'https://app.tavily.com',
  exa: 'https://dashboard.exa.ai/api-keys',
}

export const DOUBAO_DOCS = {
  custom: 'https://docs.volcengine.com/docs/87772/2272953?lang=zh',
  global: 'https://docs.volcengine.com/docs/87772/2548026?lang=zh',
} as const

export function firstOpenProvider(
  searchProvider: SearchProviderChoice,
  active: ProviderId | null,
  configured: (id: ProviderId) => boolean,
): ProviderId {
  if (searchProvider !== 'auto') return searchProvider
  if (active != null) return active
  return VENDOR_ORDER.find((id) => !configured(id)) ?? 'baidu'
}

export interface VendorTabLayout {
  visible: ProviderId[]
  overflow: ProviderId[]
  /** All vendors in a horizontal scroll strip when nothing fits beside More. */
  scrollAll: boolean
}

/** Contiguous tab window of length `maxVisible` that always includes `selected`. */
export function vendorTabLayout(
  vendors: readonly ProviderId[],
  selected: ProviderId,
  maxVisible: number,
): VendorTabLayout {
  const total = vendors.length
  if (total === 0) return { visible: [], overflow: [], scrollAll: false }
  if (maxVisible >= total) {
    return { visible: [...vendors], overflow: [], scrollAll: false }
  }
  if (maxVisible < 1) {
    return { visible: [...vendors], overflow: [], scrollAll: true }
  }

  const idx = vendors.includes(selected) ? vendors.indexOf(selected) : 0
  let start = Math.max(0, Math.min(idx, total - maxVisible))
  if (idx < start) start = idx
  if (idx >= start + maxVisible) start = idx - maxVisible + 1

  const visible = vendors.slice(start, start + maxVisible)
  const visibleSet = new Set(visible)
  const overflow = vendors.filter((id) => !visibleSet.has(id))
  return { visible, overflow, scrollAll: false }
}
