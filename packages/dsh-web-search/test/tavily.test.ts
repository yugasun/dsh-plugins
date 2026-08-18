import { describe, expect, it } from 'vitest'
import { mapTavilyExtractResponse, mapTavilyResponse } from '../src/tavily.ts'

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

describe('mapTavilyExtractResponse', () => {
  it('maps raw_content into a text fetch result', () => {
    const result = mapTavilyExtractResponse('https://tavily.example/a', {
      results: [{ url: 'https://tavily.example/a', raw_content: '  page body  ' }],
    })
    expect(result).toEqual({
      url: 'https://tavily.example/a',
      statusCode: 200,
      body: { kind: 'text', content: 'page body' },
      truncated: false,
    })
  })

  it('surfaces failed_results as a non-2xx fetch result', () => {
    const result = mapTavilyExtractResponse('https://tavily.example/gone', {
      results: [],
      failed_results: [{ url: 'https://tavily.example/gone', error: 'Failed to extract content' }],
    })
    expect(result.statusCode).toBe(502)
    expect(result.body).toEqual({ kind: 'text', content: 'Failed to extract content' })
  })
})

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
