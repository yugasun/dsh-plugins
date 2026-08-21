import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config.ts'
import { ExaSearchProvider, mapExaContentsResponse, mapExaResponse } from '../src/exa.ts'

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
    expect(result.truncated).toBe(false)
  })

  it('marks truncated when result count hits maxResults', () => {
    const result = mapExaResponse({
      results: [
        { url: 'https://exa.example/a' },
        { url: 'https://exa.example/b' },
      ],
    }, 2)
    expect(result.truncated).toBe(true)
  })
})

describe('mapExaContentsResponse', () => {
  it('maps text into a fetch result', () => {
    const result = mapExaContentsResponse('https://exa.example/a', {
      results: [{ url: 'https://exa.example/a', title: 'A', text: '  page  ' }],
    })
    expect(result).toEqual({
      url: 'https://exa.example/a',
      statusCode: 200,
      body: { kind: 'text', content: 'page' },
      truncated: false,
    })
  })

  it('returns 502 when contents has no text', () => {
    const result = mapExaContentsResponse('https://exa.example/a', { results: [] })
    expect(result.statusCode).toBe(502)
    expect(result.body.kind).toBe('text')
  })
})

describe('ExaSearchProvider.fetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the URL to /contents', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        results: [{ url: 'https://example.com/doc', text: 'cleaned page' }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new ExaSearchProvider(() => ({
      config: { ...DEFAULT_CONFIG, exaApiKey: 'exa-test-key', searchProvider: 'exa' },
      secrets: { baiduApiKey: '', doubaoApiKey: '', tavilyApiKey: '', exaApiKey: 'exa-test-key', serperApiKey: '' },
    }))
    const result = await provider.fetch({ url: 'https://example.com/doc' })
    expect(result.body).toEqual({ kind: 'text', content: 'cleaned page' })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.exa.ai/contents')
    expect(JSON.parse(String(init.body))).toMatchObject({
      urls: ['https://example.com/doc'],
      ids: ['https://example.com/doc'],
    })
  })
})
