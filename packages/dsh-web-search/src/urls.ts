/** Pull http(s) URLs out of model text when a backend returns a summary without references. */
export function extractHttpUrls(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const pattern = /https?:\/\/[^\s<>"'）】\]>]+/gi
  for (const match of text.matchAll(pattern)) {
    const raw = match[0].replace(/[.,;:!?。，、；：)\]）]+$/u, '')
    try {
      const parsed = new URL(raw)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue
      if (seen.has(parsed.href)) continue
      seen.add(parsed.href)
      out.push(parsed.href)
    } catch {
      // skip malformed
    }
  }
  return out
}

export function hitResultCap(count: number, maxResults?: number): boolean {
  return maxResults != null && maxResults > 0 && count >= maxResults
}
