import type { WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import { doubaoBaseUrlOf, doubaoSearchModeOf, type Config } from './config.ts'
import { firstNonEmpty, toIsoDate } from './errors.ts'
import { hitResultCap } from './urls.ts'
import { postJson } from './http.ts'
import { isSelected, type ResolvedSecrets } from './select.ts'

export const DOUBAO_PROVIDER_ID = 'doubao'
export const DOUBAO_CUSTOM_PATH = '/search_api/web_search'
export const DOUBAO_GLOBAL_PATH = '/search_api/global_search'
export const DOUBAO_CUSTOM_COUNT_MAX = 50
export const DOUBAO_GLOBAL_COUNT_MAX = 20
export const DOUBAO_QUERY_MAX = 100
const TRAFFIC_TAG = 'dsh_web_search'

export interface DoubaoCustomWebResult {
  Title?: string
  Url?: string
  Snippet?: string
  Summary?: string
  Content?: string
  PublishTime?: string
  SiteName?: string
}

export interface DoubaoGlobalSnippet {
  Type?: string
  Text?: string
}

export interface DoubaoGlobalDocument {
  Url?: string
  Title?: string
  Snippet?: DoubaoGlobalSnippet[]
  DocumentInfo?: { PublishTime?: string }
  HostInfo?: { Hostname?: string }
}

export interface DoubaoSearchResponse {
  Result?: {
    ResultCount?: number
    TotalDocCount?: number
    WebResults?: DoubaoCustomWebResult[]
    Documents?: DoubaoGlobalDocument[]
  }
}

export function truncateDoubaoQuery(query: string, maxChars = DOUBAO_QUERY_MAX): string {
  return query.length <= maxChars ? query : query.slice(0, maxChars)
}

function sourceFrom(
  url: string | undefined,
  title?: string,
  snippet?: string,
  publishedAt?: string,
): WebSearchSource | undefined {
  const href = url?.trim()
  if (href == null || href.length === 0) return undefined
  const iso = toIsoDate(publishedAt)
  return {
    url: href,
    ...(title != null && title.trim().length > 0 ? { title: title.trim() } : {}),
    ...(snippet != null && snippet.trim().length > 0 ? { snippet: snippet.trim() } : {}),
    ...(iso === undefined ? {} : { publishedAt: iso }),
  }
}

export function mapDoubaoCustomResults(results: DoubaoCustomWebResult[]): WebSearchSource[] {
  return results
    .map((item) => sourceFrom(
      item.Url,
      item.Title,
      firstNonEmpty(item.Summary, item.Snippet, item.Content),
      item.PublishTime,
    ))
    .filter((source): source is WebSearchSource => source !== undefined)
}

export function mapDoubaoGlobalDocuments(documents: DoubaoGlobalDocument[]): WebSearchSource[] {
  return documents
    .map((item) => {
      const snippet = (item.Snippet ?? [])
        .filter((part) => part.Type == null || part.Type === 'text')
        .map((part) => part.Text ?? '')
        .join('\n')
      return sourceFrom(item.Url, item.Title, snippet, item.DocumentInfo?.PublishTime)
    })
    .filter((source): source is WebSearchSource => source !== undefined)
}

export function mapDoubaoResponse(
  response: DoubaoSearchResponse,
  maxResults?: number,
): WebSearchResult {
  const custom = mapDoubaoCustomResults(response.Result?.WebResults ?? [])
  const global = mapDoubaoGlobalDocuments(response.Result?.Documents ?? [])
  const sources = custom.length > 0 ? custom : global
  return {
    sources,
    truncated: hitResultCap(sources.length, maxResults),
  }
}

export class DoubaoSearchProvider implements WebSearchProvider {
  readonly id = DOUBAO_PROVIDER_ID

  constructor(
    private readonly resolve: () => { config: Config; secrets: ResolvedSecrets },
  ) {}

  available(): boolean {
    const { config, secrets } = this.resolve()
    return isSelected('doubao', config, secrets)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const { config, secrets } = this.resolve()
    const mode = doubaoSearchModeOf(config)
    const topKMax = mode === 'global' ? DOUBAO_GLOBAL_COUNT_MAX : DOUBAO_CUSTOM_COUNT_MAX
    const topK = Math.min(topKMax, Math.max(1, request.maxResults ?? 10))
    const query = truncateDoubaoQuery(request.query)
    const base = doubaoBaseUrlOf(config)
    const headers = {
      authorization: `Bearer ${secrets.doubaoApiKey}`,
      'X-Traffic-Tag': TRAFFIC_TAG,
    }
    const payload = mode === 'global'
      ? await postJson(
        'Doubao',
        `${base}${DOUBAO_GLOBAL_PATH}`,
        headers,
        {
          Query: query,
          DocCount: topK,
          MaxSnippetLength: 1000,
          MaxImageCountPerDoc: 0,
        },
        signal,
      )
      : await postJson(
        'Doubao',
        `${base}${DOUBAO_CUSTOM_PATH}`,
        headers,
        {
          Query: query,
          SearchType: 'web',
          Count: topK,
          NeedSummary: true,
        },
        signal,
      )
    return mapDoubaoResponse(payload as DoubaoSearchResponse, topK)
  }
}
