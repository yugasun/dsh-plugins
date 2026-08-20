import { WebError } from './host.ts'
import { abortRequest } from './errors.ts'

export function errorCode(error: unknown): string | undefined {
  if (error instanceof WebError) return error.code
  if (error && typeof error === 'object' && 'code' in error && typeof (error as { code: unknown }).code === 'string') {
    return (error as { code: string }).code
  }
}

/** Abort and invalid URLs must not skip to the next backend. */
export function isRecoverableProviderError(error: unknown): boolean {
  const code = errorCode(error)
  return code !== 'WEB_ABORTED' && code !== 'WEB_INVALID_URL' && code !== 'WEB_PROVIDER_CONFIGURED_UNAVAILABLE'
}

/**
 * Try each id in order. When `failover` is false, the first error is thrown.
 * Abort always stops the loop.
 */
export async function firstSuccessful<I extends string, T>(
  ids: readonly I[],
  run: (id: I) => Promise<T>,
  options: {
    failover: boolean
    signal?: AbortSignal
    label: string
    onSkip?: (id: I, error: unknown) => void
  },
): Promise<T> {
  let last: unknown
  for (let i = 0; i < ids.length; i += 1) {
    if (options.signal?.aborted) abortRequest(options.label, options.signal.reason)
    const id = ids[i]
    if (id === undefined) break
    try {
      return await run(id)
    } catch (error: unknown) {
      last = error
      const code = errorCode(error)
      if (
        code === 'WEB_ABORTED'
        || options.signal?.aborted
        || !options.failover
        || i === ids.length - 1
        || !isRecoverableProviderError(error)
      ) {
        throw error
      }
      options.onSkip?.(id, error)
    }
  }
  if (last !== undefined) throw last
  throw new WebError(`${options.label} has no backend to try`, 'WEB_PROVIDER_CONFIGURED_UNAVAILABLE')
}
