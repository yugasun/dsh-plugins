import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WebFetchProvider as SearchSuiteWebFetchProvider } from 'searchsuite'
import { DEFAULT_CONFIG } from '../src/config.ts'
import { SearchSuiteFetchProvider, SearchSuiteSearchProvider } from '../src/searchsuite.ts'

const secrets = {
  baiduApiKey: '',
  doubaoApiKey: '',
  tavilyApiKey: 'tvly-test-key',
  exaApiKey: '',
  serperApiKey: '',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SearchSuiteSearchProvider', () => {
  it('keeps existing page fetch providers compatible with SearchSuite', () => {
    const resolve = () => ({
      config: DEFAULT_CONFIG,
      secrets,
    })
    const providers: SearchSuiteWebFetchProvider[] = [
      new SearchSuiteFetchProvider('tavily', resolve),
      new SearchSuiteFetchProvider('exa', resolve),
    ]

    expect(providers.map((provider) => provider.id)).toEqual(['tavily', 'exa'])
  })

  it('maps SearchSuite Tavily responses to DSH search results', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      answer: 'A concise answer',
      results: [{
        url: 'https://example.com/article',
        title: 'Article',
        content: 'A useful snippet',
        published_date: '2026-01-02',
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    const provider = new SearchSuiteSearchProvider('tavily', () => ({
      config: { ...DEFAULT_CONFIG, searchProvider: 'tavily', tavilyApiKey: secrets.tavilyApiKey },
      secrets,
    }))
    const result = await provider.search({ query: 'latest AI news', maxResults: 3 })

    expect(result).toEqual({
      content: 'A concise answer',
      sources: [{
        url: 'https://example.com/article',
        title: 'Article',
        snippet: 'A useful snippet',
        publishedAt: '2026-01-02T00:00:00.000Z',
      }],
      truncated: false,
    })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.tavily.com/search')
    expect(JSON.parse(String(init.body))).toMatchObject({
      query: 'latest AI news',
      search_depth: 'basic',
      max_results: 3,
      include_answer: true,
    })
  })

  it('passes Serper locale options through SearchSuite', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      organic: [{ link: 'https://example.com', title: 'Example' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    const provider = new SearchSuiteSearchProvider('serper', () => ({
      config: {
        ...DEFAULT_CONFIG,
        searchProvider: 'serper',
        serperApiKey: 'serper-test-key',
        serperGl: 'cn',
        serperHl: 'zh-cn',
      },
      secrets: { ...secrets, tavilyApiKey: '', serperApiKey: 'serper-test-key' },
    }))
    await provider.search({ query: '北京' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toMatchObject({ q: '北京', num: 10, gl: 'cn', hl: 'zh-cn' })
  })

  it('converts caller cancellation into the plugin abort error', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    controller.abort()

    const provider = new SearchSuiteSearchProvider('tavily', () => ({
      config: { ...DEFAULT_CONFIG, searchProvider: 'tavily', tavilyApiKey: secrets.tavilyApiKey },
      secrets,
    }))

    await expect(provider.search({ query: 'cancelled' }, controller.signal)).rejects.toMatchObject({
      code: 'WEB_ABORTED',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('SearchSuite page fetch adapters', () => {
  it('routes Tavily content fetching through SearchSuite', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      results: [{ url: 'https://example.com/article', raw_content: '  page body  ' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    const provider = new SearchSuiteFetchProvider('tavily', () => ({
      config: { ...DEFAULT_CONFIG, tavilyApiKey: secrets.tavilyApiKey, searchProvider: 'tavily' },
      secrets,
    }))
    const result = await provider.fetch({ url: 'https://example.com/article' })

    expect(result).toEqual({
      url: 'https://example.com/article',
      statusCode: 200,
      body: { kind: 'text', content: 'page body' },
      truncated: false,
    })
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.tavily.com/extract')
    expect(JSON.parse(String(init.body))).toMatchObject({
      urls: ['https://example.com/article'],
      extract_depth: 'basic',
      format: 'markdown',
    })
  })

  it('preserves Tavily no-content responses from SearchSuite', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      results: [],
      failed_results: [{ url: 'https://example.com/gone', error: 'not extractable' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } })))

    const provider = new SearchSuiteFetchProvider('tavily', () => ({
      config: { ...DEFAULT_CONFIG, tavilyApiKey: secrets.tavilyApiKey, searchProvider: 'tavily' },
      secrets,
    }))
    const result = await provider.fetch({ url: 'https://example.com/gone' })

    expect(result).toEqual({
      url: 'https://example.com/gone',
      statusCode: 502,
      body: { kind: 'text', content: 'not extractable' },
      truncated: false,
    })
  })

  it('maps cancelled page fetches to the plugin abort error', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    controller.abort()

    const provider = new SearchSuiteFetchProvider('exa', () => ({
      config: { ...DEFAULT_CONFIG, exaApiKey: 'exa-test-key', searchProvider: 'exa' },
      secrets: { ...secrets, tavilyApiKey: '', exaApiKey: 'exa-test-key' },
    }))

    await expect(provider.fetch({ url: 'https://example.com/article' }, controller.signal)).rejects.toMatchObject({
      code: 'WEB_ABORTED',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('preserves invalid URL errors at the DSH seam', async () => {
    const provider = new SearchSuiteFetchProvider('tavily', () => ({
      config: { ...DEFAULT_CONFIG, tavilyApiKey: secrets.tavilyApiKey, searchProvider: 'tavily' },
      secrets,
    }))

    await expect(provider.fetch({ url: 'file:///etc/passwd' })).rejects.toMatchObject({
      code: 'WEB_INVALID_URL',
    })
  })

  it('maps SearchSuite provider failures to the DSH provider error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ message: 'Invalid API key' }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    )))
    const provider = new SearchSuiteSearchProvider('tavily', () => ({
      config: { ...DEFAULT_CONFIG, tavilyApiKey: secrets.tavilyApiKey, searchProvider: 'tavily' },
      secrets,
    }))

    await expect(provider.search({ query: 'x' })).rejects.toMatchObject({
      code: 'WEB_PROVIDER_ERROR',
    })
  })
})
