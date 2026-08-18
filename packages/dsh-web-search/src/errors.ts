import { WebError } from '@deepseek-ai/dsh-web'

export function isAbortError(error: unknown): boolean {
  return (error instanceof DOMException && error.name === 'AbortError')
    || (error instanceof Error && error.name === 'AbortError')
}

export function abortRequest(label: string, cause?: unknown): never {
  throw new WebError(
    `${label} aborted`,
    'WEB_ABORTED',
    cause === undefined ? undefined : { cause },
  )
}

export function abortSearch(label: string, cause?: unknown): never {
  abortRequest(label, cause)
}

export function invalidFetchUrl(url: string, cause?: unknown): never {
  throw new WebError(
    `web fetch URL is invalid: ${url}`,
    'WEB_INVALID_URL',
    cause === undefined ? undefined : { cause },
  )
}

export function requireHttpUrl(url: string): URL {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch (error: unknown) {
    invalidFetchUrl(url, error)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    invalidFetchUrl(url)
  }
  return parsed
}

export function providerFailed(message: string, cause?: unknown): never {
  throw new WebError(
    message,
    'WEB_PROVIDER_ERROR',
    cause === undefined ? undefined : { cause },
  )
}

export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0
}

export function isValidBaseUrl(baseURL: string): boolean {
  return URL.canParse(baseURL)
}

export function firstNonEmpty(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (value != null && value.trim().length > 0) return value.trim()
  }
  return ''
}

export function toIsoDate(value: string | undefined | null): string | undefined {
  if (value == null) return undefined
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  const parsed = Date.parse(trimmed.replace(' ', 'T'))
  if (Number.isNaN(parsed)) return trimmed
  return new Date(parsed).toISOString()
}
