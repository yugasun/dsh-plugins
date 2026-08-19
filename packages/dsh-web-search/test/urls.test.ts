import { describe, expect, it } from 'vitest'
import { extractHttpUrls, hitResultCap } from '../src/urls.ts'

describe('extractHttpUrls', () => {
  it('collects unique http(s) URLs and strips trailing punctuation', () => {
    expect(extractHttpUrls('see https://example.com/a. also https://example.com/a and https://news.example/b。')).toEqual([
      'https://example.com/a',
      'https://news.example/b',
    ])
  })
})

describe('hitResultCap', () => {
  it('is true only when a positive cap is filled', () => {
    expect(hitResultCap(3)).toBe(false)
    expect(hitResultCap(2, 3)).toBe(false)
    expect(hitResultCap(3, 3)).toBe(true)
    expect(hitResultCap(0, 0)).toBe(false)
  })
})
