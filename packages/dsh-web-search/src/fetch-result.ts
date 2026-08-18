import type { WebFetchResult } from '@deepseek-ai/dsh-web'

export const MAX_FETCH_CHARS = 100_000

export function textFetchResult(
  url: string,
  content: string,
  statusCode = 200,
): WebFetchResult {
  const truncated = content.length > MAX_FETCH_CHARS
  return {
    url,
    statusCode,
    body: {
      kind: 'text',
      content: truncated ? content.slice(0, MAX_FETCH_CHARS) : content,
    },
    truncated,
  }
}

export function failedFetchResult(url: string, message: string, statusCode = 502): WebFetchResult {
  return {
    url,
    statusCode,
    body: { kind: 'text', content: message },
    truncated: false,
  }
}
