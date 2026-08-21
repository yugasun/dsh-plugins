import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config.ts'
import { TavilySearchProvider } from '../src/tavily.ts'

function tavilyProvider() {
  return new TavilySearchProvider(() => ({
    config: { ...DEFAULT_CONFIG, tavilyApiKey: 'tvly-test-key', searchProvider: 'tavily' },
    secrets: { baiduApiKey: '', doubaoApiKey: '', tavilyApiKey: 'tvly-test-key', exaApiKey: '', serperApiKey: '' },
  }))
}

describe('TavilySearchProvider.search', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the query and returns mapped sources', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        answer: 'ok',
        results: [{ url: 'https://example.com', title: 'Example', content: 'Hello' }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = tavilyProvider()

    expect(provider.available()).toBe(true)
    const result = await provider.search({ query: 'deepseek harness', maxResults: 3 })
    expect(result.content).toBe('ok')
    expect(result.sources[0]?.url).toBe('https://example.com')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.tavily.com/search')
    expect(JSON.parse(String(init.body))).toMatchObject({
      query: 'deepseek harness',
      max_results: 3,
      include_answer: true,
    })
  })

  it('surfaces HTTP failures as WEB_PROVIDER_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ message: 'Invalid API key' }), { status: 401 }),
    ))
    const provider = tavilyProvider()
    await expect(provider.search({ query: 'x' })).rejects.toMatchObject({
      name: 'WebError',
      code: 'WEB_PROVIDER_ERROR',
      message: 'Invalid API key',
    })
  })
})

describe('TavilySearchProvider.fetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the URL to /extract', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        results: [{ url: 'https://example.com/doc', raw_content: '# Hello' }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await tavilyProvider().fetch({ url: 'https://example.com/doc' })
    expect(result.body).toEqual({ kind: 'text', content: '# Hello' })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.tavily.com/extract')
    expect(JSON.parse(String(init.body))).toMatchObject({
      urls: ['https://example.com/doc'],
      extract_depth: 'basic',
      format: 'markdown',
    })
  })

  it('rejects non-http URLs', async () => {
    await expect(tavilyProvider().fetch({ url: 'file:///etc/passwd' })).rejects.toMatchObject({
      name: 'WebError',
      code: 'WEB_INVALID_URL',
    })
  })
})
