import type { WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import type { Config } from './config.ts'
import { firstNonEmpty } from './errors.ts'
import { hitResultCap } from './urls.ts'
import { postJson } from './http.ts'
import { isSelected, type ResolvedSecrets } from './select.ts'

export const DOUBAO_PROVIDER_ID = 'doubao'

export interface DoubaoAnnotation {
  type?: string
  title?: string
  url?: string
  url_citation?: {
    title?: string
    url?: string
    site_name?: string
  }
}

export interface DoubaoContentPart {
  type?: string
  text?: string
  output_text?: string
  annotations?: DoubaoAnnotation[]
}

export interface DoubaoOutputItem {
  type?: string
  content?: DoubaoContentPart[] | string
  annotations?: DoubaoAnnotation[]
  action?: {
    query?: string
    sources?: Array<{ url?: string; title?: string; snippet?: string }>
  }
}

export interface DoubaoSearchResponse {
  output?: DoubaoOutputItem[]
  output_text?: string
}

export function mapDoubaoAnnotation(ann: DoubaoAnnotation): WebSearchSource | undefined {
  if (ann.type != null && ann.type !== 'url_citation') return undefined
  const nested = ann.url_citation ?? {}
  const url = firstNonEmpty(ann.url, nested.url)
  if (url.length === 0) return undefined
  const title = firstNonEmpty(ann.title, nested.title, nested.site_name)
  return {
    url,
    ...(title.length > 0 ? { title } : {}),
  }
}

export function mapDoubaoResponse(
  response: DoubaoSearchResponse,
  maxResults?: number,
): WebSearchResult {
  const texts: string[] = []
  const sources: WebSearchSource[] = []
  const seen = new Set<string>()

  const pushSource = (source: WebSearchSource | undefined) => {
    if (source === undefined || seen.has(source.url)) return
    seen.add(source.url)
    sources.push(source)
  }

  if (response.output_text != null && response.output_text.trim().length > 0) {
    texts.push(response.output_text.trim())
  }

  for (const item of response.output ?? []) {
    if (item.type === 'web_search_call') {
      for (const source of item.action?.sources ?? []) {
        const url = source.url?.trim()
        if (url == null || url.length === 0) continue
        pushSource({
          url,
          ...(source.title != null && source.title.trim().length > 0 ? { title: source.title.trim() } : {}),
          ...(source.snippet != null && source.snippet.trim().length > 0 ? { snippet: source.snippet.trim() } : {}),
        })
      }
    }

    if (typeof item.content === 'string' && item.content.trim().length > 0) {
      texts.push(item.content.trim())
    }

    const parts = Array.isArray(item.content) ? item.content : []
    for (const part of parts) {
      const text = firstNonEmpty(part.text, part.output_text)
      if (text.length > 0) texts.push(text)
      for (const ann of part.annotations ?? []) pushSource(mapDoubaoAnnotation(ann))
    }
    for (const ann of item.annotations ?? []) pushSource(mapDoubaoAnnotation(ann))
  }

  const content = texts.find((text) => text.length > 0)
  return {
    ...(content === undefined ? {} : { content }),
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
    const limit = request.maxResults ?? 10
    const payload = await postJson(
      'Doubao',
      `${config.doubaoBaseURL.replace(/\/$/, '')}/responses`,
      { authorization: `Bearer ${secrets.doubaoApiKey}` },
      {
        model: config.doubaoModel,
        stream: false,
        thinking: { type: 'disabled' },
        tools: [{ type: 'web_search', max_keyword: 2, limit }],
        input: [{ role: 'user', content: [{ type: 'input_text', text: request.query }] }],
      },
      signal,
    )
    return mapDoubaoResponse(payload as DoubaoSearchResponse, limit)
  }
}
