import { describe, expect, it } from 'vitest'
import { mapTavilyResponse } from '../src/tavily.ts'

describe('mapTavilyResponse', () => {
  it('maps answer and results into content plus sources', () => {
    const result = mapTavilyResponse({
      answer: 'Tavily summary',
      results: [
        { url: 'https://tavily.example/a', title: 'A', content: 'alpha', published_date: '2026-01-02' },
        { title: 'Missing url' },
      ],
    })
    expect(result.content).toBe('Tavily summary')
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0]).toMatchObject({
      url: 'https://tavily.example/a',
      title: 'A',
      snippet: 'alpha',
    })
  })
})
