declare module '@deepseek-ai/dsh-web' {
  export class WebError extends Error {
    readonly code: string
    constructor(message: string, code: string, options?: ErrorOptions)
  }

  export interface WebSearchRequest {
    readonly query: string
    readonly maxResults?: number
  }

  export interface WebSearchSource {
    readonly url: string
    readonly title?: string
    readonly snippet?: string
    readonly publishedAt?: string
  }

  export interface WebSearchResult {
    readonly content?: string
    readonly sources: readonly WebSearchSource[]
    readonly truncated: boolean
  }

  export interface WebSearchProvider {
    readonly id: string
    available(): boolean
    search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>
  }
}
