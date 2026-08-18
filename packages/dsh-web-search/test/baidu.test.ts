import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config.ts'
import { BaiduSearchProvider, mapBaiduResponse, truncateBaiduQuery } from '../src/baidu.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('truncateBaiduQuery', () => {
  it('keeps ASCII within the unit budget', () => {
    expect(truncateBaiduQuery('hello', 4)).toBe('hell')
  })

  it('counts CJK as two units', () => {
    expect(truncateBaiduQuery('你好世界', 4)).toBe('你好')
  })
})

describe('mapBaiduResponse', () => {
  it('maps web references and skips entries without a URL', () => {
    const result = mapBaiduResponse({
      references: [
        {
          type: 'web',
          url: 'https://example.com/a',
          title: 'Alpha',
          snippet: 'snippet-a',
          date: '2026-04-27 18:02:00',
        },
        { type: 'video', url: 'https://example.com/video', title: 'Skip me' },
        { type: 'web', title: 'No url' },
      ],
      choices: [{ message: { content: '北京有很多值得游览的景点。' } }],
    })
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0]).toMatchObject({
      url: 'https://example.com/a',
      title: 'Alpha',
      snippet: 'snippet-a',
    })
    expect(result.sources[0]?.publishedAt).toBe(new Date('2026-04-27T18:02:00').toISOString())
    expect(result.content).toBe('北京有很多值得游览的景点。')
  })
})

describe('BaiduSearchProvider.search', () => {
  it('uses the chat completions endpoint and Bearer API key authentication', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        choices: [{ message: { content: 'summary' } }],
        references: [{ type: 'web', url: 'https://example.com', title: 'Example' }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new BaiduSearchProvider(() => ({
      config: { ...DEFAULT_CONFIG, baiduModel: 'ernie-4.5-turbo-32k', searchProvider: 'baidu' },
      secrets: { baiduApiKey: 'baidu-api-key', doubaoApiKey: '', tavilyApiKey: '', exaApiKey: '' },
    }))
    const result = await provider.search({ query: '北京景点', maxResults: 3 })

    expect(result.content).toBe('summary')
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://qianfan.baidubce.com/v2/ai_search/chat/completions')
    expect(init.headers).toMatchObject({ authorization: 'Bearer baidu-api-key' })
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: 'ernie-4.5-turbo-32k',
      search_source: 'baidu_search_v2',
      resource_type_filter: [{ type: 'web', top_k: 3 }],
      search_mode: 'required',
      stream: false,
    })
  })
})
