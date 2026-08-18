import type { WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import { firstNonEmpty, toIsoDate } from './errors.ts'
import { postJson } from './http.ts'
import { isSelected, type ResolvedSecrets } from './select.ts'
import type { Config } from './config.ts'

export const BAIDU_PROVIDER_ID = 'baidu'
const BAIDU_QUERY_UNITS = 72

export interface BaiduReference {
  url?: string
  title?: string
  snippet?: string
  content?: string
  date?: string
  type?: string
}

export interface BaiduSearchResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  references?: BaiduReference[]
  request_id?: string
}

export function truncateBaiduQuery(query: string, maxUnits = BAIDU_QUERY_UNITS): string {
  let units = 0
  let out = ''
  for (const ch of query) {
    const weight = ch.codePointAt(0)! > 127 ? 2 : 1
    if (units + weight > maxUnits) break
    units += weight
    out += ch
  }
  return out
}

export function mapBaiduReference(ref: BaiduReference): WebSearchSource | undefined {
  const url = ref.url?.trim()
  if (url == null || url.length === 0) return undefined
  const snippet = firstNonEmpty(ref.snippet, ref.content)
  const publishedAt = toIsoDate(ref.date)
  return {
    url,
    ...(ref.title != null && ref.title.trim().length > 0 ? { title: ref.title.trim() } : {}),
    ...(snippet.length > 0 ? { snippet } : {}),
    ...(publishedAt === undefined ? {} : { publishedAt }),
  }
}

export function mapBaiduResponse(response: BaiduSearchResponse): WebSearchResult {
  const sources = (response.references ?? [])
    .filter((ref) => ref.type == null || ref.type === 'web')
    .map(mapBaiduReference)
    .filter((source): source is WebSearchSource => source !== undefined)
  const content = response.choices?.[0]?.message?.content?.trim()
  return {
    ...(content != null && content.length > 0 ? { content } : {}),
    sources,
    truncated: false,
  }
}

export class BaiduSearchProvider implements WebSearchProvider {
  readonly id = BAIDU_PROVIDER_ID

  constructor(
    private readonly resolve: () => { config: Config; secrets: ResolvedSecrets },
  ) {}

  available(): boolean {
    const { config, secrets } = this.resolve()
    return isSelected('baidu', config, secrets)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const { config, secrets } = this.resolve()
    const topK = Math.min(20, Math.max(1, request.maxResults ?? 10))
    const payload = await postJson(
      'Baidu',
      `${config.baiduBaseURL.replace(/\/$/, '')}/v2/ai_search/chat/completions`,
      { authorization: `Bearer ${secrets.baiduApiKey}` },
      {
        messages: [{ role: 'user', content: truncateBaiduQuery(request.query) }],
        model: config.baiduModel,
        search_source: 'baidu_search_v2',
        resource_type_filter: [{ type: 'web', top_k: topK }],
        search_mode: 'required',
        stream: false,
      },
      signal,
    )
    return mapBaiduResponse(payload as BaiduSearchResponse)
  }
}
