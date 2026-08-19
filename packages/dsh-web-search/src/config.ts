import Schema from '@deepseek-ai/schemastery'
import type { FetchProviderChoice, SearchProviderChoice } from './types.ts'

export interface Config {
  /** When false, official `web_search` stays on DSH built-in `deepseek-official`. */
  customSearch: boolean
  searchProvider: SearchProviderChoice
  /** Independent of search. `auto` follows Tavily/Exa search; `http` is DSH built-in. */
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

export const SETTINGS_NS = 'dsh-web-search'

export const BAIDU_DEFAULT_BASE_URL = 'https://qianfan.baidubce.com'
export const BAIDU_DEFAULT_MODEL = 'ernie-4.5-turbo-32k'
export const DOUBAO_DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'
export const DOUBAO_DEFAULT_MODEL = 'doubao-seed-1-6-250615'
export const TAVILY_DEFAULT_BASE_URL = 'https://api.tavily.com'
export const EXA_DEFAULT_BASE_URL = 'https://api.exa.ai'
export const EXA_DEFAULT_PROVIDER_ID = 'exa'
export const EXA_DEFAULT_HIGHLIGHTS = 1

export const Config: Schema<Config> = Schema.object({
  customSearch: Schema.boolean().default(true).description(
    'When on, web_search uses a backend configured on this page. When off, it uses DSH built-in DeepSeek search.',
  ),
  searchProvider: Schema.union(['auto', 'baidu', 'doubao', 'tavily', 'exa'] as const).default('auto'),
  fetchProvider: Schema.union(['auto', 'http', 'tavily', 'exa'] as const).default('auto').description(
    'web_fetch backend. Auto follows Tavily/Exa when that search backend is active; http uses DSH built-in fetch.',
  ),
  baiduApiKey: Schema.string().role('secret').default(''),
  baiduBaseURL: Schema.string().default(BAIDU_DEFAULT_BASE_URL),
  baiduModel: Schema.string().default(BAIDU_DEFAULT_MODEL),
  doubaoApiKey: Schema.string().role('secret').default(''),
  doubaoBaseURL: Schema.string().default(DOUBAO_DEFAULT_BASE_URL),
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
})

export const DEFAULT_CONFIG: Config = {
  customSearch: true,
  searchProvider: 'auto',
  fetchProvider: 'auto',
  baiduApiKey: '',
  baiduBaseURL: BAIDU_DEFAULT_BASE_URL,
  baiduModel: BAIDU_DEFAULT_MODEL,
  doubaoApiKey: '',
  doubaoBaseURL: DOUBAO_DEFAULT_BASE_URL,
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
}

export const AUTO_PROVIDER_ORDER = ['baidu', 'doubao', 'tavily', 'exa'] as const
export const AUTO_FETCH_ORDER = ['tavily', 'exa'] as const
