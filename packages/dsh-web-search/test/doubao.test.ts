import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG, DOUBAO_LEGACY_ARK_BASE_URL, doubaoBaseUrlOf } from '../src/config.ts'
import {
  DoubaoSearchProvider,
  mapDoubaoResponse,
  truncateDoubaoQuery,
} from '../src/doubao.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('truncateDoubaoQuery', () => {
  it('keeps queries within 100 characters', () => {
    expect(truncateDoubaoQuery('hello', 4)).toBe('hell')
  })
})

describe('doubaoBaseUrlOf', () => {
  it('rewrites the legacy Ark endpoint to Search Infinity', () => {
    expect(doubaoBaseUrlOf({ doubaoBaseURL: DOUBAO_LEGACY_ARK_BASE_URL })).toBe('https://open.feedcoopapi.com')
  })
})

describe('mapDoubaoResponse', () => {
  it('maps Custom WebResults', () => {
    const result = mapDoubaoResponse({
      Result: {
        WebResults: [
          {
            Title: 'Alpha',
            Url: 'https://example.com/a',
            Summary: 'summary-a',
            PublishTime: '2026-04-27 18:02:00',
          },
          { Title: 'No url', Snippet: 'skip' },
        ],
      },
    })
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0]).toMatchObject({
      url: 'https://example.com/a',
      title: 'Alpha',
      snippet: 'summary-a',
    })
    expect(result.sources[0]?.publishedAt).toBe(new Date('2026-04-27T18:02:00').toISOString())
  })

  it('maps Global Documents snippets', () => {
    const result = mapDoubaoResponse({
      Result: {
        Documents: [
          {
            Title: 'Beta',
            Url: 'https://news.example/b',
            Snippet: [
              { Type: 'text', Text: 'hello' },
              { Type: 'image', Text: 'skip' },
              { Type: 'text', Text: 'world' },
            ],
            DocumentInfo: { PublishTime: '2026-01-02' },
          },
        ],
      },
    })
    expect(result.sources).toEqual([
      expect.objectContaining({
        url: 'https://news.example/b',
        title: 'Beta',
        snippet: 'hello\nworld',
      }),
    ])
  })
})

describe('DoubaoSearchProvider.search', () => {
  const secrets = { baiduApiKey: '', doubaoApiKey: 'doubao-api-key', tavilyApiKey: '', exaApiKey: '' }

  it('defaults to Custom web_search without a model', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        Result: { WebResults: [{ Title: 'Example', Url: 'https://example.com', Snippet: 'snippet' }] },
      }), { status: 200, headers: { 'content-type': 'application/json' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new DoubaoSearchProvider(() => ({
      config: { ...DEFAULT_CONFIG, searchProvider: 'doubao' },
      secrets,
    }))
    const result = await provider.search({ query: '北京景点', maxResults: 3 })

    expect(result.sources[0]?.url).toBe('https://example.com')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://open.feedcoopapi.com/search_api/web_search')
    expect(init.headers).toMatchObject({
      authorization: 'Bearer doubao-api-key',
      'X-Traffic-Tag': 'dsh_web_search',
    })
    expect(JSON.parse(String(init.body))).toEqual({
      Query: '北京景点',
      SearchType: 'web',
      Count: 3,
      NeedSummary: true,
    })
  })

  it('uses global_search when Global is selected', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        Result: { Documents: [{ Title: 'Example', Url: 'https://example.com', Snippet: [{ Type: 'text', Text: 'hi' }] }] },
      }), { status: 200, headers: { 'content-type': 'application/json' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new DoubaoSearchProvider(() => ({
      config: { ...DEFAULT_CONFIG, doubaoSearchMode: 'global', searchProvider: 'doubao' },
      secrets,
    }))
    await provider.search({ query: 'python 3.13', maxResults: 5 })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://open.feedcoopapi.com/search_api/global_search')
    expect(JSON.parse(String(init.body))).toEqual({
      Query: 'python 3.13',
      DocCount: 5,
      MaxSnippetLength: 1000,
      MaxImageCountPerDoc: 0,
    })
  })
})
