import { WebError } from '@deepseek-ai/dsh-web'
import type { Config } from './config.ts'
import { SECRET_ENVS, facadeAvailable, selectActive, type ResolvedSecrets } from './select.ts'
import type { ProviderId, WebSearchProvider, WebSearchRequest, WebSearchResult } from './types.ts'
import { SEAM_PROVIDER_ID } from './types.ts'

const KEY_HINT = 'Store it in Settings → Web search, the credentials service, or ~/.dsh/.env (then restart dsh web). A shell export inside a tool call does not reach the harness process.'

function secretField(id: ProviderId): keyof ResolvedSecrets {
  switch (id) {
    case 'baidu':
      return 'baiduApiKey'
    case 'doubao':
      return 'doubaoApiKey'
    case 'tavily':
      return 'tavilyApiKey'
    case 'exa':
      return 'exaApiKey'
  }
}

export function missingCredential(id: ProviderId): never {
  const names = SECRET_ENVS[secretField(id)].map((name) => `"${name}"`).join(' or ')
  throw new WebError(
    `${id} search has no API key for ${names}. ${KEY_HINT}`,
    'WEB_PROVIDER_CREDENTIAL_MISSING',
  )
}

export function missingAnyCredential(): never {
  throw new WebError(
    `No search backend has an API key (TAVILY_API_KEY, BAIDU_API_KEY, ARK_API_KEY, or EXA_API_KEY). ${KEY_HINT}`,
    'WEB_PROVIDER_CREDENTIAL_MISSING',
  )
}

export class PluginSearchProvider implements WebSearchProvider {
  readonly id = SEAM_PROVIDER_ID

  constructor(
    private readonly backends: Record<ProviderId, WebSearchProvider>,
    private readonly resolve: () => { config: Config; secrets: ResolvedSecrets },
    private readonly refresh: () => Promise<void>,
  ) {}

  available(): boolean {
    const { config, secrets } = this.resolve()
    return facadeAvailable(config, secrets)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    await this.refresh()
    const { config, secrets } = this.resolve()
    if (config.customSearch === false) {
      throw new WebError(
        'Custom search is off. Official web_search uses DSH built-in deepseek-official.',
        'WEB_PROVIDER_CONFIGURED_UNAVAILABLE',
      )
    }
    const id = selectActive(config, secrets)
    if (id == null) {
      if (config.searchProvider === 'auto') missingAnyCredential()
      missingCredential(config.searchProvider)
    }
    return this.backends[id].search(request, signal)
  }
}
