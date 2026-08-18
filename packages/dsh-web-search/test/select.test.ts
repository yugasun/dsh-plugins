import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, type Config } from '../src/config.ts'
import type { EnvLookup } from '../src/env.ts'
import { secretCommit, secretDisplay, SECRET_MASK } from '../src/client/secret-field.ts'
import { configuredSeamProviderId, facadeAvailable, mergeSecrets, listAvailable, pinWebSearchProvider, pluginStatus, resolveSecrets, selectActive } from '../src/select.ts'
import { credentialOverlay } from '../src/credentials.ts'
import { PluginSearchProvider } from '../src/provider.ts'
import { BUILTIN_SEAM_PROVIDER_ID, SEAM_PROVIDER_ID } from '../src/types.ts'

function config(patch: Partial<Config> = {}): Config {
  return { ...DEFAULT_CONFIG, ...patch }
}

function env(values: Record<string, string> = {}): EnvLookup {
  return {
    get(name: string): string {
      return values[name] ?? ''
    },
  }
}

describe('selectActive', () => {
  it('returns null when no keys are present', () => {
    const current = config()
    const secrets = resolveSecrets(current, env())
    expect(selectActive(current, secrets)).toBeNull()
    expect(listAvailable(current, secrets)).toEqual([])
  })

  it('auto-picks the first usable provider in Baidu → Doubao → Tavily → Exa order', () => {
    const current = config({ tavilyApiKey: 'tvly-test-key', exaApiKey: 'exa-test-key' })
    const secrets = resolveSecrets(current, env())
    expect(selectActive(current, secrets)).toBe('tavily')
    expect(listAvailable(current, secrets)).toEqual(['tavily', 'exa'])
  })

  it('honors an explicit provider even when others are keyed', () => {
    const current = config({ searchProvider: 'exa', tavilyApiKey: 'tvly-test-key', exaApiKey: 'exa-test-key' })
    const secrets = resolveSecrets(current, env())
    expect(selectActive(current, secrets)).toBe('exa')
  })

  it('returns null when the explicit provider has no key', () => {
    const current = config({ searchProvider: 'baidu', tavilyApiKey: 'tvly-test-key' })
    const secrets = resolveSecrets(current, env())
    expect(selectActive(current, secrets)).toBeNull()
  })

  it('reads environment fallbacks', () => {
    const current = config()
    const secrets = resolveSecrets(current, env({ TAVILY_API_KEY: 'from-env' }))
    expect(secrets.tavilyApiKey).toBe('from-env')
    const status = pluginStatus(current, secrets)
    expect(status.customSearch).toBe(true)
    expect(status.seamProvider).toBe(SEAM_PROVIDER_ID)
    expect(status.active).toBe('tavily')
    expect(status.providers.find((provider) => provider.id === 'tavily')).toMatchObject({
      available: true,
      configured: true,
    })
  })

  it('ignores placeholder keys that are too short, so auto can reach Tavily', () => {
    const current = config({ baiduApiKey: 'd', tavilyApiKey: 'tvly-test-key' })
    const secrets = resolveSecrets(current, env())
    expect(selectActive(current, secrets)).toBe('tavily')
  })
})

describe('secret field mask', () => {
  it('shows the password mask when a key is configured and the user is not editing', () => {
    expect(secretDisplay(null, true)).toBe(SECRET_MASK)
    expect(secretDisplay(null, false)).toBe('')
    expect(secretDisplay('typed', true)).toBe('typed')
  })

  it('does not save the mask or an empty draft', () => {
    expect(secretCommit('')).toEqual({ kind: 'keep' })
    expect(secretCommit('   ')).toEqual({ kind: 'keep' })
    expect(secretCommit(SECRET_MASK)).toEqual({ kind: 'keep' })
    expect(secretCommit(' tvly-new ')).toEqual({ kind: 'set', value: 'tvly-new' })
  })
})

describe('credential overlay', () => {
  it('merges credentials under settings and launch env', () => {
    const merged = mergeSecrets(
      { baiduApiKey: '', doubaoApiKey: '', tavilyApiKey: '', exaApiKey: '' },
      { tavilyApiKey: 'from-credentials' },
    )
    expect(merged.tavilyApiKey).toBe('from-credentials')
  })

  it('does not let credentials replace a settings key', () => {
    const merged = mergeSecrets(
      { baiduApiKey: '', doubaoApiKey: '', tavilyApiKey: 'from-settings', exaApiKey: '' },
      { tavilyApiKey: 'from-credentials' },
    )
    expect(merged.tavilyApiKey).toBe('from-settings')
  })

  it('reads TAVILY_API_KEY from the credentials service', async () => {
    const overlay = await credentialOverlay({
      resolve: async (ref) => ref === 'TAVILY_API_KEY' ? { value: 'tvly-cred' } : undefined,
    })
    expect(overlay.tavilyApiKey).toBe('tvly-cred')
  })
})

describe('customSearch switch', () => {
  it('pins the official seam and hides the facade when custom search is off', () => {
    const current = config({ customSearch: false, tavilyApiKey: 'tvly-test-key' })
    const secrets = resolveSecrets(current, env())
    expect(configuredSeamProviderId(current)).toBe(BUILTIN_SEAM_PROVIDER_ID)
    expect(facadeAvailable(current, secrets)).toBe(false)
    expect(pluginStatus(current, secrets)).toMatchObject({
      customSearch: false,
      seamProvider: BUILTIN_SEAM_PROVIDER_ID,
      active: null,
    })
    const web = { searchProviderId: SEAM_PROVIDER_ID }
    pinWebSearchProvider(web, current)
    expect(web.searchProviderId).toBe(BUILTIN_SEAM_PROVIDER_ID)
  })

  it('pins this plugin when custom search is on', () => {
    const current = config({ customSearch: true })
    expect(configuredSeamProviderId(current)).toBe(SEAM_PROVIDER_ID)
    const web = { searchProviderId: BUILTIN_SEAM_PROVIDER_ID }
    pinWebSearchProvider(web, current)
    expect(web.searchProviderId).toBe(SEAM_PROVIDER_ID)
  })
})

describe('PluginSearchProvider', () => {
  it('is available when Tavily is pinned even before the key overlay lands', () => {
    const current = config({ searchProvider: 'tavily' })
    const empty = { baiduApiKey: '', doubaoApiKey: '', tavilyApiKey: '', exaApiKey: '' }
    expect(facadeAvailable(current, empty)).toBe(true)
    expect(selectActive(current, empty)).toBeNull()
  })

  it('loads a credential key on search and dispatches to Tavily', async () => {
    const current = config({ searchProvider: 'tavily' })
    let secrets = { baiduApiKey: '', doubaoApiKey: '', tavilyApiKey: '', exaApiKey: '' }
    const tavily = {
      id: 'tavily',
      available: () => true,
      search: async () => ({ sources: [{ url: 'https://example.com' }], truncated: false }),
    }
    const provider = new PluginSearchProvider(
      {
        baidu: tavily,
        doubao: tavily,
        tavily,
        exa: tavily,
      },
      () => ({ config: current, secrets }),
      async () => {
        secrets = { ...secrets, tavilyApiKey: 'tvly-cred' }
      },
    )
    expect(provider.id).toBe(SEAM_PROVIDER_ID)
    expect(provider.available()).toBe(true)
    const result = await provider.search({ query: 'hello' })
    expect(result.sources[0]?.url).toBe('https://example.com')
  })

  it('explains a missing Tavily key instead of looking unset', async () => {
    const current = config({ searchProvider: 'tavily' })
    const secrets = { baiduApiKey: '', doubaoApiKey: '', tavilyApiKey: '', exaApiKey: '' }
    const unused = {
      id: 'tavily',
      available: () => false,
      search: async () => ({ sources: [], truncated: false }),
    }
    const provider = new PluginSearchProvider(
      { baidu: unused, doubao: unused, tavily: unused, exa: unused },
      () => ({ config: current, secrets }),
      async () => {},
    )
    await expect(provider.search({ query: 'hello' })).rejects.toMatchObject({
      name: 'WebError',
      code: 'WEB_PROVIDER_CREDENTIAL_MISSING',
    })
  })

  it('refuses to search through the facade when custom search is off', async () => {
    const current = config({ customSearch: false, searchProvider: 'tavily', tavilyApiKey: 'tvly-test-key' })
    const secrets = resolveSecrets(current, env())
    const unused = {
      id: 'tavily',
      available: () => true,
      search: async () => ({ sources: [], truncated: false }),
    }
    const provider = new PluginSearchProvider(
      { baidu: unused, doubao: unused, tavily: unused, exa: unused },
      () => ({ config: current, secrets }),
      async () => {},
    )
    expect(provider.available()).toBe(false)
    await expect(provider.search({ query: 'hello' })).rejects.toMatchObject({
      name: 'WebError',
      code: 'WEB_PROVIDER_CONFIGURED_UNAVAILABLE',
    })
  })
})
