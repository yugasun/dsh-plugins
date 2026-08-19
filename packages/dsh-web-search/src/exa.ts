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
import { failedFetchResult, MAX_FETCH_CHARS, textFetchResult } from './fetch-result.ts'
import { postJson } from './http.ts'
import { isSelected, type ResolvedSecrets } from './select.ts'

export interface ExaResult {
  url?: string
  title?: string | null
  publishedDate?: string | null
  highlights?: string[]
  text?: string
}

export interface ExaSearchResponse {
  results?: ExaResult[]
}

export function mapExaResult(result: ExaResult): WebSearchSource | undefined {
  const url = result.url?.trim()
  if (url == null || url.length === 0) return undefined
  const snippet = result.highlights?.find((highlight) => highlight.trim().length > 0)?.trim()
    ?? result.text?.trim()
  const publishedAt = toIsoDate(result.publishedDate)
  return {
    url,
    ...(result.title != null && result.title.trim().length > 0 ? { title: result.title.trim() } : {}),
    ...(snippet != null && snippet.length > 0 ? { snippet } : {}),
    ...(publishedAt === undefined ? {} : { publishedAt }),
  }
}

export function mapExaResponse(
  response: ExaSearchResponse,
  maxResults?: number,
): WebSearchResult {
  const sources = (response.results ?? [])
    .map(mapExaResult)
    .filter((source): source is WebSearchSource => source !== undefined)
  return { sources, truncated: hitResultCap(sources.length, maxResults) }
}

export interface ExaContentsResponse {
  results?: ExaResult[]
}

export function mapExaContentsResponse(
  requestUrl: string,
  response: ExaContentsResponse,
): WebFetchResult {
  const hit = (response.results ?? []).find((result) => {
    const url = result.url?.trim()
    return url != null && url.length > 0
  })
  const content = hit?.text?.trim()
  if (content != null && content.length > 0) {
    return textFetchResult(hit?.url?.trim() || requestUrl, content)
  }
  return failedFetchResult(hit?.url?.trim() || requestUrl, 'Exa contents returned no text')
}

export class ExaSearchProvider implements WebSearchProvider, WebFetchProvider {
  constructor(
    private readonly resolve: () => { config: Config; secrets: ResolvedSecrets },
  ) {}

  get id(): string {
    const { config } = this.resolve()
    const id = config.exaProviderId.trim()
    return id.length > 0 ? id : 'exa'
  }

  available(): boolean {
    const { config, secrets } = this.resolve()
    return isSelected('exa', config, secrets)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const { config, secrets } = this.resolve()
    const payload = await postJson(
      'Exa',
      `${config.exaBaseURL.replace(/\/$/, '')}/search`,
      { authorization: `Bearer ${secrets.exaApiKey}` },
      {
        query: request.query,
        type: config.exaSearchType,
        contents: { highlights: { highlightsPerUrl: config.exaHighlightsPerResult } },
        ...(request.maxResults === undefined ? {} : { numResults: request.maxResults }),
      },
      signal,
    )
    return mapExaResponse(payload as ExaSearchResponse, request.maxResults)
  }

  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    const parsed = requireHttpUrl(request.url)
    const { config, secrets } = this.resolve()
    const payload = await postJson(
      'Exa',
      `${config.exaBaseURL.replace(/\/$/, '')}/contents`,
      { authorization: `Bearer ${secrets.exaApiKey}` },
      {
        urls: [parsed.toString()],
        ids: [parsed.toString()],
        text: { maxCharacters: MAX_FETCH_CHARS },
      },
      signal,
    )
    return mapExaContentsResponse(parsed.toString(), payload as ExaContentsResponse)
  }
}
