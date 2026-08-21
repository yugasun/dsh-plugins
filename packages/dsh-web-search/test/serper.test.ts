import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config.ts'
import {
  extractSerperAnswer,
  mapSerperResponse,
  mapSerperResult,
  SerperSearchProvider,
} from '../src/serper.ts'

describe('mapSerperResult', () => {
  it('maps title, snippet, and a parseable date', () => {
    const source = mapSerperResult({
      title: ' Alpha ',
      link: 'https://serper.example/a',
      snippet: '  first hit  ',
      date: 'Apr 27, 2026',
    })
    expect(source).toMatchObject({
      url: 'https://serper.example/a',
      title: 'Alpha',
      snippet: 'first hit',
    })
    expect(source?.publishedAt).toBe(new Date('Apr 27, 2026').toISOString())
  })

  it('skips results without a URL', () => {
    expect(mapSerperResult({ title: 'Missing link' })).toBeUndefined()
  })
})

describe('extractSerperAnswer', () => {
  it('prefers the answer box over the knowledge graph', () => {
    expect(extractSerperAnswer({
      answerBox: { snippet: 'boxed' },
      knowledgeGraph: { description: 'kg' },
    })).toBe('boxed')
  })

  it('falls back to the knowledge graph description', () => {
    expect(extractSerperAnswer({
      knowledgeGraph: { description: '  entity  ' },
    })).toBe('entity')
  })
})

describe('mapSerperResponse', () => {
  it('maps organic hits and an answer box', () => {
    const result = mapSerperResponse({
      answerBox: { snippet: 'Serper summary' },
      organic: [
        { link: 'https://serper.example/a', title: 'A', snippet: 'alpha' },
        { title: 'Missing url' },
      ],
    })
    expect(result.content).toBe('Serper summary')
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0]).toMatchObject({
      url: 'https://serper.example/a',
      title: 'A',
      snippet: 'alpha',
    })
    expect(result.truncated).toBe(false)
  })

  it('marks truncated when result count hits maxResults', () => {
    const result = mapSerperResponse({
      organic: [
        { link: 'https://serper.example/a' },
        { link: 'https://serper.example/b' },
      ],
    }, 2)
    expect(result.truncated).toBe(true)
  })
})

describe('SerperSearchProvider.search', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const secrets = {
    baiduApiKey: '',
    doubaoApiKey: '',
    tavilyApiKey: '',
    exaApiKey: '',
    serperApiKey: 'serper-test-key',
  }

  it('posts the query to /search with the API key header', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        organic: [{ link: 'https://example.com', title: 'Example', snippet: 'Hello' }],
        answerBox: { snippet: 'ok' },
      }), { status: 200, headers: { 'content-type': 'application/json' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new SerperSearchProvider(() => ({
      config: { ...DEFAULT_CONFIG, searchProvider: 'serper' },
      secrets,
    }))
    expect(provider.available()).toBe(true)
    const result = await provider.search({ query: 'deepseek harness', maxResults: 3 })
    expect(result.content).toBe('ok')
    expect(result.sources[0]?.url).toBe('https://example.com')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://google.serper.dev/search')
    expect(init.headers).toMatchObject({ 'X-API-KEY': 'serper-test-key' })
    expect(JSON.parse(String(init.body))).toEqual({
      q: 'deepseek harness',
      num: 3,
    })
  })

  it('includes gl and hl when configured', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ organic: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new SerperSearchProvider(() => ({
      config: { ...DEFAULT_CONFIG, searchProvider: 'serper', serperGl: 'cn', serperHl: 'zh-cn' },
      secrets,
    }))
    await provider.search({ query: '北京' })
    expect(JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))).toMatchObject({
      q: '北京',
      gl: 'cn',
      hl: 'zh-cn',
    })
  })
})
