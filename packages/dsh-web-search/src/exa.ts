import type { WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import type { Config } from './config.ts'
import { toIsoDate } from './errors.ts'
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

export function mapExaResponse(response: ExaSearchResponse): WebSearchResult {
  const sources = (response.results ?? [])
    .map(mapExaResult)
    .filter((source): source is WebSearchSource => source !== undefined)
  return { sources, truncated: false }
}

export class ExaSearchProvider implements WebSearchProvider {
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
    return mapExaResponse(payload as ExaSearchResponse)
  }
}
