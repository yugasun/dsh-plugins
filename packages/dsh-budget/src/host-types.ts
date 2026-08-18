export interface TextBlock {
  type: 'text'
  text: string
}

export interface ContentBlock {
  type: string
  text?: string
  content?: ContentBlock[]
}

export interface UserMessage {
  role?: string
  content: ContentBlock[]
  source?: {
    kind?: string
    plugin?: string
    form?: string
    summary?: string
  }
  id?: string
}

export interface ToolResult {
  isError?: boolean
  content: ContentBlock[]
  additionalContexts?: UserMessage[]
}

export interface PostToolDecision {
  kind: 'accept' | 'block'
  content?: ContentBlock[]
  value?: unknown
  additionalContexts?: UserMessage[]
  feedback?: ContentBlock[]
}

export interface ToolExec {
  name: string
  callId?: string
  parent?: unknown
  agent?: {
    session?: {
      header?: { id?: string }
    }
    inject?: (message: UserMessage) => void
  }
}

export interface TokenMeasurement {
  surfaceTokens?: number
  totalTokens?: number
}

export interface TokenMeter {
  measure(session: unknown): TokenMeasurement
  estimateMessage?(message: unknown): number
}

export interface SessionSurface {
  nodes: readonly number[]
}

export interface SessionEventLike {
  type: string
  seq?: number
  data?: {
    message?: {
      content?: Array<{
        type?: string
        content?: ContentBlock[]
        text?: string
        toolCallId?: string
        isError?: boolean
      }>
      [key: string]: unknown
    }
    [key: string]: unknown
  }
}

export interface SessionLike {
  events: readonly SessionEventLike[]
  surface?: SessionSurface
  append(type: string, data: unknown, opts?: unknown): { seq: number }
}

export interface SpillRef {
  locator: string
  bytes: number
  retrievalHint: string
}

export interface SpillStore {
  saveText(input: {
    owner: { sessionId: string }
    source: { toolName: string; callId: string; label: string }
    suggestedName: string
    content: string
  }): Promise<SpillRef>
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

export interface Logger {
  warn(message: string): void
  info?(message: string): void
}

export interface HostContext {
  on(event: string, listener: (...args: never[]) => unknown, options?: { prepend?: boolean }): () => void
  get(name: string): unknown
  inject(deps: string[], callback: (ctx: HostContext) => void): void
  effect(callback: () => (() => void) | void, label?: string): void
  logger?: Logger
  webServer?: WebServer
}
