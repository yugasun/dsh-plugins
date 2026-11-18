import { Context } from '@deepseek-ai/cordis'
import { WebRuntime } from '@deepseek-ai/dsh-web'
import { createVolatile, updateVolatile } from '@deepseek-ai/cosmokit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config.ts'
import * as plugin from '../src/index.ts'
import { SECRET_ENVS } from '../src/select.ts'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Harness rc.5 integration', () => {
  it('routes search and fetch through the live plugin configuration', async () => {
    for (const name of Object.values(SECRET_ENVS).flat()) vi.stubEnv(name, '')
    const ctx = new Context()
    ctx.provide('settings', { configure: () => () => {} })
    await ctx.plugin(WebRuntime, { searchProvider: 'deepseek-official', fetchProvider: 'http' })
    ctx.web.registerSearchProvider({
      id: 'deepseek-official', available: () => true,
      search: async () => ({ sources: [{ url: 'https://builtin.example' }], truncated: false }),
    })
    ctx.web.registerFetchProvider({
      id: 'http', available: () => true,
      fetch: async (request) => ({ url: request.url, statusCode: 200, body: { kind: 'text', content: 'builtin' }, truncated: false }),
    })
    const active = await ctx.plugin(plugin, { ...DEFAULT_CONFIG, customSearch: false })
    try {
      expect(active.config.get().customSearch).toBe(false)
      expect((await ctx.web.search({ query: 'compatibility' })).sources[0]?.url).toBe('https://builtin.example')
      expect((await ctx.web.fetch({ url: 'https://example.com' })).body).toEqual({ kind: 'text', content: 'builtin' })
      // A live edit must affect the next request without remounting the plugin.
      updateVolatile(active.config, createVolatile({ ...DEFAULT_CONFIG, searchProvider: 'tavily', fetchProvider: 'exa' }))
      ctx.emit('settings/document-updated', 'dsh-web-search', 1)
      await expect(ctx.web.search({ query: 'compatibility' })).rejects.toMatchObject({ code: 'WEB_PROVIDER_CREDENTIAL_MISSING' })
      await expect(ctx.web.fetch({ url: 'https://example.com' })).rejects.toMatchObject({ code: 'WEB_PROVIDER_CREDENTIAL_MISSING' })
      updateVolatile(active.config, createVolatile({ ...DEFAULT_CONFIG, customSearch: false }))
      ctx.emit('settings/document-updated', 'dsh-web-search', 2)
      expect((await ctx.web.search({ query: 'compatibility' })).sources[0]?.url).toBe('https://builtin.example')
      expect((await ctx.web.fetch({ url: 'https://example.com' })).body).toEqual({ kind: 'text', content: 'builtin' })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('routes an explicit AnySearch selection without a key through web_search', async () => {
    for (const name of Object.values(SECRET_ENVS).flat()) vi.stubEnv(name, '')
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => Response.json({
      code: 0,
      message: 'success',
      data: {
        results: Array.from({ length: 10 }, (_, index) => ({
          title: `Result ${index + 1}`,
          url: `https://example.com/${index + 1}`,
          snippet: `Snippet ${index + 1}`,
        })),
        metadata: { total_results: 10 },
      },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const ctx = new Context()
    ctx.provide('settings', { configure: () => () => {} })
    await ctx.plugin(WebRuntime, { searchProvider: 'deepseek-official', fetchProvider: 'http' })
    await ctx.plugin(plugin, {
      ...DEFAULT_CONFIG,
      searchProvider: 'anysearch',
      anysearchBaseURL: 'https://search.example',
    })
    try {
      const result = await ctx.web.search({ query: 'free web search', maxResults: 25 })
      expect(result.sources[0]).toEqual({
        url: 'https://example.com/1',
        title: 'Result 1',
        snippet: 'Snippet 1',
      })
      expect(result.sources).toHaveLength(10)
      expect(result.truncated).toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0]!
      expect(url).toBe('https://search.example/v1/search')
      expect(init.method).toBe('POST')
      expect(new Headers(init.headers).has('authorization')).toBe(false)
      expect(JSON.parse(String(init.body))).toEqual({ query: 'free web search', max_results: 10 })
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
