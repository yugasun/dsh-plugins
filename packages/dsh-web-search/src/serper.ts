import type { WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import type { Config } from './config.ts'
import { toIsoDate } from './errors.ts'
import { hitResultCap } from './urls.ts'
import { postJson } from './http.ts'
import { isSelected, type ResolvedSecrets } from './select.ts'

export const SERPER_PROVIDER_ID = 'serper'

export interface SerperOrganicResult {
  title?: string
  link?: string
  snippet?: string
  date?: string
  position?: number
}

export interface SerperAnswerBox {
  snippet?: string
  title?: string
}

export interface SerperKnowledgeGraph {
  title?: string
  type?: string
  description?: string
}

export interface SerperSearchResponse {
  searchParameters?: {
    q?: string
    gl?: string
    hl?: string
    num?: number
  }
  answerBox?: SerperAnswerBox
  knowledgeGraph?: SerperKnowledgeGraph
  organic?: SerperOrganicResult[]
}

export function mapSerperResult(result: SerperOrganicResult): WebSearchSource | undefined {
  const url = result.link?.trim()
  if (url == null || url.length === 0) return undefined
  const publishedAt = toIsoDate(result.date)
  return {
    url,
    ...(result.title != null && result.title.trim().length > 0 ? { title: result.title.trim() } : {}),
    ...(result.snippet != null && result.snippet.trim().length > 0 ? { snippet: result.snippet.trim() } : {}),
    ...(publishedAt === undefined ? {} : { publishedAt }),
  }
}

export function extractSerperAnswer(response: SerperSearchResponse): string | undefined {
  const answer = response.answerBox?.snippet?.trim()
  if (answer != null && answer.length > 0) return answer
  const kg = response.knowledgeGraph?.description?.trim()
  if (kg != null && kg.length > 0) return kg
  return undefined
}

export function mapSerperResponse(
  response: SerperSearchResponse,
  maxResults?: number,
): WebSearchResult {
  const sources = (response.organic ?? [])
    .map(mapSerperResult)
    .filter((source): source is WebSearchSource => source !== undefined)
  const content = extractSerperAnswer(response)
  return {
    ...(content != null && content.length > 0 ? { content } : {}),
    sources,
    truncated: hitResultCap(sources.length, maxResults),
  }
}

export class SerperSearchProvider implements WebSearchProvider {
  readonly id = SERPER_PROVIDER_ID

  constructor(
    private readonly resolve: () => { config: Config; secrets: ResolvedSecrets },
  ) {}

  available(): boolean {
    const { config, secrets } = this.resolve()
    return isSelected('serper', config, secrets)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const { config, secrets } = this.resolve()
    const num = Math.min(100, Math.max(1, request.maxResults ?? 10))
    const base = config.serperBaseURL.replace(/\/$/, '')
    const body: Record<string, unknown> = {
      q: request.query,
      num,
    }
    if (config.serperGl.trim().length > 0) body.gl = config.serperGl
    if (config.serperHl.trim().length > 0) body.hl = config.serperHl
    const payload = await postJson(
      'Serper',
      `${base}/search`,
      { 'X-API-KEY': secrets.serperApiKey },
      body,
      signal,
    )
    return mapSerperResponse(payload as SerperSearchResponse, num)
  }
}
