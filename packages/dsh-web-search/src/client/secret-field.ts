/** Placeholder stored in the password input when a key exists but must not be echoed. */
export const SECRET_MASK = '********'

export function secretDisplay(draft: string | null, configured: boolean): string {
  if (draft !== null) return draft
  return configured ? SECRET_MASK : ''
}

export function secretCommit(draft: string): { kind: 'keep' } | { kind: 'set'; value: string } | { kind: 'clear' } {
  const trimmed = draft.trim()
  if (trimmed === SECRET_MASK) return { kind: 'keep' }
  if (trimmed.length === 0) return { kind: 'clear' }
  return { kind: 'set', value: trimmed }
}
