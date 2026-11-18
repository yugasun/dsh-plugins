import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config.ts'
import { parseProbeProvider, probeProvider } from '../src/probe.ts'
import { resolveSecrets } from '../src/select.ts'

describe('parseProbeProvider', () => {
  it('accepts known backend ids', () => {
    expect(parseProbeProvider('tavily')).toBe('tavily')
    expect(parseProbeProvider('serper')).toBe('serper')
    expect(parseProbeProvider('anysearch')).toBe('anysearch')
    expect(parseProbeProvider('nope')).toBeUndefined()
    expect(parseProbeProvider(1)).toBeUndefined()
  })
})

describe('probeProvider', () => {
  it('skips the network when the backend has no key', async () => {
    const unused = {
      id: 'tavily',
      available: () => false,
      search: async () => {
        throw new Error('should not search')
      },
    }
    const result = await probeProvider(
      { baidu: unused, doubao: unused, tavily: unused, exa: unused, serper: unused, anysearch: unused },
      DEFAULT_CONFIG,
      resolveSecrets(DEFAULT_CONFIG, { get: () => '' }),
      'tavily',
    )
    expect(result).toMatchObject({
      ok: false,
      provider: 'tavily',
      code: 'WEB_PROVIDER_CREDENTIAL_MISSING',
    })
  })

  it('returns source count from a successful search', async () => {
    const tavily = {
      id: 'tavily',
      available: () => true,
      search: async () => ({ sources: [{ url: 'https://example.com' }], truncated: false }),
    }
    const unused = {
      id: 'unused',
      available: () => false,
      search: async () => ({ sources: [], truncated: false }),
    }
    const result = await probeProvider(
      { baidu: unused, doubao: unused, tavily, exa: unused, serper: unused, anysearch: unused },
      DEFAULT_CONFIG,
      resolveSecrets(DEFAULT_CONFIG, { get: (name) => name === 'TAVILY_API_KEY' ? 'tavily-test-key' : '' }),
      'tavily',
    )
    expect(result).toEqual({ ok: true, provider: 'tavily', sources: 1 })
  })

  it('allows a direct AnySearch probe without a key while auto is selected', async () => {
    const anysearch = {
      id: 'anysearch',
      available: () => true,
      search: async () => ({ sources: [{ url: 'https://example.com' }], truncated: false }),
    }
    const unused = {
      id: 'unused',
      available: () => false,
      search: async () => { throw new Error('should not search') },
    }
    expect(await probeProvider(
      { baidu: unused, doubao: unused, tavily: unused, exa: unused, serper: unused, anysearch },
      DEFAULT_CONFIG,
      resolveSecrets(DEFAULT_CONFIG, { get: () => '' }),
      'anysearch',
    )).toEqual({ ok: true, provider: 'anysearch', sources: 1 })
  })
})
