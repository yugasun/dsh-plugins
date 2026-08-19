export interface IncomingHttp {
  method?: string
  json?(): Promise<unknown>
  on?(event: string, listener: (...args: unknown[]) => void): unknown
}

export function requestMethod(req: IncomingHttp): string {
  return (req.method ?? 'GET').toUpperCase()
}

/** Read a JSON body from a Node stream or a Fetch Request. */
export async function readHttpJson(req: IncomingHttp): Promise<unknown> {
  if (typeof req.json === 'function' && typeof req.on !== 'function') {
    return req.json()
  }
  if (typeof req.on !== 'function') return {}
  const chunks: Buffer[] = []
  return await new Promise((resolve, reject) => {
    req.on!('data', (chunk: unknown) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
    })
    req.on!('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim()
      if (raw.length === 0) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw) as unknown)
      } catch (error: unknown) {
        reject(error)
      }
    })
    req.on!('error', reject)
  })
}
