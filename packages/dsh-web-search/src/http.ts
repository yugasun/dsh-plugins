import { abortSearch, isAbortError, providerFailed } from './errors.ts'
import { USER_AGENT } from './types.ts'

export interface JsonErrorBody {
  error?: string | { message?: string }
  message?: string
  msg?: string
  code?: string | number
}

export async function postJson(
  label: string,
  url: string,
  headers: Record<string, string>,
  body: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      redirect: 'error',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': USER_AGENT,
        ...headers,
      },
      body: JSON.stringify(body),
      ...(signal === undefined ? {} : { signal }),
    })
  } catch (error: unknown) {
    if (isAbortError(error)) abortSearch(label, error)
    providerFailed(`${label} search request failed: ${String(error)}`, error)
  }

  if (!response.ok) {
    const status = response.status
    let message = `${label} API error (HTTP ${status})`
    try {
      const parsed = await response.json() as JsonErrorBody
      const detail = extractErrorMessage(parsed)
      if (detail.length > 0) message = detail
    } catch (error: unknown) {
      if (isAbortError(error)) abortSearch(label, error)
    }
    providerFailed(message)
  }

  try {
    return await response.json()
  } catch (error: unknown) {
    if (isAbortError(error)) abortSearch(label, error)
    providerFailed(`${label} returned an unprocessable response body: ${String(error)}`, error)
  }
}

export function extractErrorMessage(body: JsonErrorBody): string {
  if (typeof body.error === 'string' && body.error.length > 0) return body.error
  if (typeof body.error === 'object' && body.error?.message && body.error.message.length > 0) {
    return body.error.message
  }
  if (typeof body.message === 'string' && body.message.length > 0) return body.message
  if (typeof body.msg === 'string' && body.msg.length > 0) return body.msg
  return ''
}
