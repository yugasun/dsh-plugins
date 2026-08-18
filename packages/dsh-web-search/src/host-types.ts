export interface Logger {
  warn(message: string): void
  info?(message: string): void
}

export interface WebServer {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: unknown, res: {
      statusCode: number
      setHeader(name: string, value: string): void
      end(body?: string): void
    }) => void
  }): () => void
}

export interface WebRuntime {
  /**
   * Runtime-writable even though `@deepseek-ai/dsh-web` types it private.
   * Selection reads this field on every `search()`.
   */
  searchProviderId?: string
  registerSearchProvider(provider: {
    readonly id: string
    available(): boolean
    search(request: unknown, signal?: AbortSignal): Promise<unknown>
  }): () => void
}

export interface HostContext {
  web: WebRuntime
  get(name: string): unknown
  inject(deps: string[], callback: (ctx: HostContext) => void): void
  effect(callback: () => (() => void) | void, label?: string): void
  on?(event: string, listener: (...args: unknown[]) => void): () => void
  logger?: Logger
  webServer?: WebServer
  systemPrompt?: {
    section(section: { name: string; order: number; text: string }): () => void
  }
}
