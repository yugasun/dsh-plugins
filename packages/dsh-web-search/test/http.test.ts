import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config.ts'
import { TavilySearchProvider } from '../src/tavily.ts'

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

    const provider = new TavilySearchProvider(() => ({
      config: { ...DEFAULT_CONFIG, tavilyApiKey: 'tvly-test-key', searchProvider: 'tavily' },
      secrets: { baiduApiKey: '', doubaoApiKey: '', tavilyApiKey: 'tvly-test-key', exaApiKey: '' },
    }))

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
    const provider = new TavilySearchProvider(() => ({
      config: { ...DEFAULT_CONFIG, tavilyApiKey: 'tvly-bad-key', searchProvider: 'tavily' },
      secrets: { baiduApiKey: '', doubaoApiKey: '', tavilyApiKey: 'tvly-bad-key', exaApiKey: '' },
    }))
    await expect(provider.search({ query: 'x' })).rejects.toMatchObject({
      name: 'WebError',
      code: 'WEB_PROVIDER_ERROR',
      message: 'Invalid API key',
    })
  })
})
