import { describe, expect, it } from 'vitest'
import { mapExaResponse } from '../src/exa.ts'

describe('mapExaResponse', () => {
  it('prefers highlights and falls back to text', () => {
    const result = mapExaResponse({
      results: [
        { url: 'https://exa.example/a', title: 'A', highlights: ['  first hit  '] },
        { url: 'https://exa.example/b', title: 'B', text: 'full text' },
        { url: 'https://exa.example/c', highlights: [''] },
      ],
    })
    expect(result.sources).toEqual([
      { url: 'https://exa.example/a', title: 'A', snippet: 'first hit' },
      { url: 'https://exa.example/b', title: 'B', snippet: 'full text' },
      { url: 'https://exa.example/c' },
    ])
  })
})
