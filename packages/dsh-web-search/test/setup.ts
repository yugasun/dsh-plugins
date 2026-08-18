import { vi } from 'vitest'

class WebError extends Error {
  readonly code: string
  constructor(message: string, code: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'WebError'
    this.code = code
  }
}

vi.mock('@deepseek-ai/dsh-web', () => ({ WebError }))
