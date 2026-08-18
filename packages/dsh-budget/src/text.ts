import { charsForTokens, estimateTokens } from './estimate.ts'

/** Keep a head and tail so the model still sees start and end of a dump. */
export function headTail(text: string, maxChars: number): string {
  if (maxChars <= 0) return ''
  if (text.length <= maxChars) return text
  if (maxChars <= 32) return text.slice(0, maxChars)
  const head = Math.ceil((maxChars - 17) / 2)
  const tail = Math.floor((maxChars - 17) / 2)
  return `${text.slice(0, head)}\n…[omitted]…\n${text.slice(-tail)}`
}

/** Shrink `text` until {@link estimateTokens} is at most `maxTokens`. */
export function shrinkToTokens(text: string, maxTokens: number): string {
  if (maxTokens <= 0) return ''
  if (estimateTokens(text) <= maxTokens) return text
  let maxChars = charsForTokens(maxTokens)
  let next = headTail(text, maxChars)
  while (next.length > 0 && estimateTokens(next) > maxTokens) {
    maxChars = Math.max(0, maxChars - 16)
    next = headTail(text, maxChars)
  }
  return next
}
