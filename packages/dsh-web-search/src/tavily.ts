import type { WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import type { Config } from './config.ts'
import { toIsoDate } from './errors.ts'
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

export function mapTavilyResponse(response: TavilySearchResponse): WebSearchResult {
  const sources = (response.results ?? [])
    .map(mapTavilyResult)
    .filter((source): source is WebSearchSource => source !== undefined)
  const content = response.answer?.trim()
  return {
    ...(content != null && content.length > 0 ? { content } : {}),
    sources,
    truncated: false,
  }
}

export class TavilySearchProvider implements WebSearchProvider {
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
    const payload = await postJson(
      'Tavily',
      `${config.tavilyBaseURL.replace(/\/$/, '')}/search`,
      { authorization: `Bearer ${secrets.tavilyApiKey}` },
      {
        query: request.query,
        search_depth: config.tavilySearchDepth,
        max_results: request.maxResults ?? 8,
        include_answer: true,
        include_raw_content: false,
        include_images: false,
      },
      signal,
    )
    return mapTavilyResponse(payload as TavilySearchResponse)
  }
}
