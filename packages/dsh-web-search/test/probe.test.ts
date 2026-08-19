import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config.ts'
import { parseProbeProvider, probeProvider } from '../src/probe.ts'

describe('parseProbeProvider', () => {
  it('accepts known backend ids', () => {
    expect(parseProbeProvider('tavily')).toBe('tavily')
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
      { baidu: unused, doubao: unused, tavily: unused, exa: unused },
      DEFAULT_CONFIG,
      { baiduApiKey: '', doubaoApiKey: '', tavilyApiKey: '', exaApiKey: '' },
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
      { baidu: unused, doubao: unused, tavily, exa: unused },
      { ...DEFAULT_CONFIG, tavilyApiKey: 'tvly-test-key' },
      { baiduApiKey: '', doubaoApiKey: '', tavilyApiKey: 'tvly-test-key', exaApiKey: '' },
      'tavily',
    )
    expect(result).toEqual({ ok: true, provider: 'tavily', sources: 1 })
  })
})
