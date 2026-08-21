import type SchemaType from '@deepseek-ai/schemastery'
import { Schema } from './host.ts'
import type { FetchProviderChoice, SearchProviderChoice } from './types.ts'

export type BaiduSearchMode = 'web' | 'ai'
export type DoubaoSearchMode = 'custom' | 'global'

export interface Config {
  /** When false, official `web_search` stays on DSH built-in `deepseek-official`. */
  customSearch: boolean
  searchProvider: SearchProviderChoice
  /** Independent of search. `auto` follows Tavily/Exa search; `http` is DSH built-in. */
  fetchProvider: FetchProviderChoice
  baiduApiKey: string
  baiduBaseURL: string
  /** `web` is Qianfan web_search; `ai` is intelligent search generation (slower). */
  baiduSearchMode: BaiduSearchMode
  baiduModel: string
  doubaoApiKey: string
  doubaoBaseURL: string
  /** `custom` is Doubao Search Custom (Chinese, richer filters). `global` is the international index. */
  doubaoSearchMode: DoubaoSearchMode
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
  serperApiKey: string
  serperBaseURL: string
  /** ISO 3166-1 alpha-2 country for geolocation. Empty uses Serper default. */
  serperGl: string
  /** ISO 639-1 language for results. Empty uses Serper default. */
  serperHl: string
}

export const SETTINGS_NS = 'dsh-web-search'

export const BAIDU_DEFAULT_BASE_URL = 'https://qianfan.baidubce.com'
export const BAIDU_DEFAULT_SEARCH_MODE: BaiduSearchMode = 'web'
export const BAIDU_DEFAULT_MODEL = 'ernie-4.5-turbo-32k'
export const DOUBAO_DEFAULT_BASE_URL = 'https://open.feedcoopapi.com'
export const DOUBAO_LEGACY_ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'
export const DOUBAO_DEFAULT_SEARCH_MODE: DoubaoSearchMode = 'custom'
export const DOUBAO_DEFAULT_MODEL = 'doubao-seed-1-6-250615'
export const TAVILY_DEFAULT_BASE_URL = 'https://api.tavily.com'
export const EXA_DEFAULT_BASE_URL = 'https://api.exa.ai'
export const EXA_DEFAULT_PROVIDER_ID = 'exa'
export const EXA_DEFAULT_HIGHLIGHTS = 1
export const SERPER_DEFAULT_BASE_URL = 'https://google.serper.dev'

export const Config: SchemaType<Config> = Schema.object({
  customSearch: Schema.boolean().default(true).description(
    'When on, web_search uses a backend configured on this page. When off, it uses DSH built-in DeepSeek search.',
  ),
  searchProvider: Schema.union(['auto', 'baidu', 'doubao', 'tavily', 'exa', 'serper'] as const).default('auto'),
  fetchProvider: Schema.union(['auto', 'http', 'tavily', 'exa'] as const).default('auto').description(
    'web_fetch backend. Auto follows Tavily/Exa when that search backend is active; http uses DSH built-in fetch.',
  ),
  baiduApiKey: Schema.string().role('secret').default(''),
  baiduBaseURL: Schema.string().default(BAIDU_DEFAULT_BASE_URL),
  baiduSearchMode: Schema.union(['web', 'ai'] as const).default(BAIDU_DEFAULT_SEARCH_MODE).description(
    'web is Qianfan web_search (faster, links and snippets). ai is intelligent search generation (slower, model summary).',
  ),
  baiduModel: Schema.string().default(BAIDU_DEFAULT_MODEL),
  doubaoApiKey: Schema.string().role('secret').default(''),
  doubaoBaseURL: Schema.string().default(DOUBAO_DEFAULT_BASE_URL),
  doubaoSearchMode: Schema.union(['custom', 'global'] as const).default(DOUBAO_DEFAULT_SEARCH_MODE).description(
    'custom is Doubao Search Custom (Chinese, richer filters). global is the international index.',
  ),
  doubaoModel: Schema.string().default(DOUBAO_DEFAULT_MODEL),
  tavilyApiKey: Schema.string().role('secret').default(''),
  tavilyBaseURL: Schema.string().default(TAVILY_DEFAULT_BASE_URL),
  tavilySearchDepth: Schema.union(['basic', 'advanced', 'fast', 'ultra-fast'] as const).default('basic'),
  tavilyExtractDepth: Schema.union(['basic', 'advanced'] as const).default('basic'),
  exaApiKey: Schema.string().role('secret').default(''),
  exaBaseURL: Schema.string().default(EXA_DEFAULT_BASE_URL),
  exaSearchType: Schema.union(['auto', 'keyword', 'neural'] as const).default('auto'),
  exaProviderId: Schema.string().default(EXA_DEFAULT_PROVIDER_ID),
  exaHighlightsPerResult: Schema.number().step(1).min(1).default(EXA_DEFAULT_HIGHLIGHTS),
  serperApiKey: Schema.string().role('secret').default(''),
  serperBaseURL: Schema.string().default(SERPER_DEFAULT_BASE_URL),
  serperGl: Schema.string().default('').description('Country code for geolocation (ISO 3166-1 alpha-2).'),
  serperHl: Schema.string().default('').description('Language code for results (ISO 639-1).'),
})

export const DEFAULT_CONFIG: Config = {
  customSearch: true,
  searchProvider: 'auto',
  fetchProvider: 'auto',
  baiduApiKey: '',
  baiduBaseURL: BAIDU_DEFAULT_BASE_URL,
  baiduSearchMode: BAIDU_DEFAULT_SEARCH_MODE,
  baiduModel: BAIDU_DEFAULT_MODEL,
  doubaoApiKey: '',
  doubaoBaseURL: DOUBAO_DEFAULT_BASE_URL,
  doubaoSearchMode: DOUBAO_DEFAULT_SEARCH_MODE,
  doubaoModel: DOUBAO_DEFAULT_MODEL,
  tavilyApiKey: '',
  tavilyBaseURL: TAVILY_DEFAULT_BASE_URL,
  tavilySearchDepth: 'basic',
  tavilyExtractDepth: 'basic',
  exaApiKey: '',
  exaBaseURL: EXA_DEFAULT_BASE_URL,
  exaSearchType: 'auto',
  exaProviderId: EXA_DEFAULT_PROVIDER_ID,
  exaHighlightsPerResult: EXA_DEFAULT_HIGHLIGHTS,
  serperApiKey: '',
  serperBaseURL: SERPER_DEFAULT_BASE_URL,
  serperGl: '',
  serperHl: '',
}

export const AUTO_PROVIDER_ORDER = ['baidu', 'doubao', 'tavily', 'exa', 'serper'] as const
export const AUTO_FETCH_ORDER = ['tavily', 'exa'] as const

export function baiduSearchModeOf(config: Pick<Config, 'baiduSearchMode'>): BaiduSearchMode {
  return config.baiduSearchMode === 'ai' ? 'ai' : 'web'
}

export function doubaoSearchModeOf(config: Pick<Config, 'doubaoSearchMode'>): DoubaoSearchMode {
  return config.doubaoSearchMode === 'global' ? 'global' : 'custom'
}

export function doubaoBaseUrlOf(config: Pick<Config, 'doubaoBaseURL'>): string {
  const raw = config.doubaoBaseURL.replace(/\/$/, '')
  if (raw.length === 0 || raw === DOUBAO_LEGACY_ARK_BASE_URL) return DOUBAO_DEFAULT_BASE_URL
  return raw
}
