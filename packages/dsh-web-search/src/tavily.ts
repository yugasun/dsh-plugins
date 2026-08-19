import type {
  WebFetchProvider,
  WebFetchRequest,
  WebFetchResult,
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '@deepseek-ai/dsh-web'
import type { Config } from './config.ts'
import { requireHttpUrl, toIsoDate } from './errors.ts'
import { hitResultCap } from './urls.ts'
import { failedFetchResult, textFetchResult } from './fetch-result.ts'
import { postJson } from './http.ts'
import { isSelected, type ResolvedSecrets } from './select.ts'

export const TAVILY_PROVIDER_ID = 'tavily'

export interface TavilyResult {
  url?: string
  title?: string
  content?: string
  published_date?: string
}

export interface TavilySearchResponse {
  answer?: string
  results?: TavilyResult[]
}

export interface TavilyExtractResult {
  url?: string
  raw_content?: string | null
}

export interface TavilyFailedExtract {
  url?: string
  error?: string
}

export interface TavilyExtractResponse {
  results?: TavilyExtractResult[]
  failed_results?: TavilyFailedExtract[]
}

export function mapTavilyExtractResponse(
  requestUrl: string,
  response: TavilyExtractResponse,
): WebFetchResult {
  const hit = (response.results ?? []).find((result) => {
    const url = result.url?.trim()
    return url != null && url.length > 0
  })
  const content = hit?.raw_content?.trim()
  if (content != null && content.length > 0) {
    return textFetchResult(hit?.url?.trim() || requestUrl, content)
  }
  const failed = (response.failed_results ?? []).find((result) => {
    const url = result.url?.trim()
    return url == null || url.length === 0 || urlsMatch(url, requestUrl)
  })
  const message = failed?.error?.trim()
  return failedFetchResult(
    failed?.url?.trim() || requestUrl,
    message != null && message.length > 0 ? message : 'Tavily extract returned no content',
  )
}

function urlsMatch(left: string, right: string): boolean {
  return left === right || left.replace(/\/$/, '') === right.replace(/\/$/, '')
}

export function mapTavilyResult(result: TavilyResult): WebSearchSource | undefined {
  const url = result.url?.trim()
  if (url == null || url.length === 0) return undefined
  const publishedAt = toIsoDate(result.published_date)
  return {
    url,
    ...(result.title != null && result.title.trim().length > 0 ? { title: result.title.trim() } : {}),
    ...(result.content != null && result.content.trim().length > 0 ? { snippet: result.content.trim() } : {}),
    ...(publishedAt === undefined ? {} : { publishedAt }),
  }
}

export function mapTavilyResponse(
  response: TavilySearchResponse,
  maxResults?: number,
): WebSearchResult {
  const sources = (response.results ?? [])
    .map(mapTavilyResult)
    .filter((source): source is WebSearchSource => source !== undefined)
  const content = response.answer?.trim()
  return {
    ...(content != null && content.length > 0 ? { content } : {}),
    sources,
    truncated: hitResultCap(sources.length, maxResults),
  }
}

export class TavilySearchProvider implements WebSearchProvider, WebFetchProvider {
  readonly id = TAVILY_PROVIDER_ID

  constructor(
    private readonly resolve: () => { config: Config; secrets: ResolvedSecrets },
  ) {}

  available(): boolean {
    const { config, secrets } = this.resolve()
    return isSelected('tavily', config, secrets)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const { config, secrets } = this.resolve()
    const maxResults = request.maxResults ?? 8
    const payload = await postJson(
      'Tavily',
      `${config.tavilyBaseURL.replace(/\/$/, '')}/search`,
      { authorization: `Bearer ${secrets.tavilyApiKey}` },
      {
        query: request.query,
        search_depth: config.tavilySearchDepth,
        max_results: maxResults,
        include_answer: true,
        include_raw_content: false,
        include_images: false,
      },
      signal,
    )
    return mapTavilyResponse(payload as TavilySearchResponse, maxResults)
  }

  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    const parsed = requireHttpUrl(request.url)
    const { config, secrets } = this.resolve()
    const payload = await postJson(
      'Tavily',
      `${config.tavilyBaseURL.replace(/\/$/, '')}/extract`,
      { authorization: `Bearer ${secrets.tavilyApiKey}` },
      {
        urls: [parsed.toString()],
        extract_depth: config.tavilyExtractDepth,
        format: 'markdown',
        include_images: false,
      },
      signal,
    )
    return mapTavilyExtractResponse(parsed.toString(), payload as TavilyExtractResponse)
  }
}
