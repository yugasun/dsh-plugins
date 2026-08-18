/** Heuristic token estimate: ~4 characters per token. */
export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.max(1, Math.ceil(text.length / 4))
}

/** Inverse of {@link estimateTokens}: characters that fit in `tokens`. */
export function charsForTokens(tokens: number): number {
  return Math.max(0, Math.floor(tokens) * 4)
}
