import { describe, expect, it } from 'vitest'
import { formatBytes, formatTokens } from '../src/client/model.ts'

describe('formatTokens', () => {
  it('keeps small values as integers', () => {
    expect(formatTokens(0)).toBe('0')
    expect(formatTokens(256)).toBe('256')
    expect(formatTokens(999)).toBe('999')
  })

  it('uses one decimal between 1k and 10k', () => {
    expect(formatTokens(1000)).toBe('1k')
    expect(formatTokens(4123)).toBe('4.1k')
  })

  it('rounds at 10k and above', () => {
    expect(formatTokens(64_000)).toBe('64k')
    expect(formatTokens(12_400)).toBe('12k')
  })

  it('formats bytes', () => {
    expect(formatBytes(800)).toBe('800 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
  })
})
