import { WebError } from './host.ts'
import type { Config } from './config.ts'
import { errorCode, firstSuccessful } from './failover.ts'
import type { Logger } from './host-types.ts'
import {
  SECRET_ENVS,
  facadeAvailable,
  fetchCandidates,
  fetchChoiceOf,
  fetchFacadeAvailable,
  fetchFailoverEnabled,
  providerUsable,
  searchCandidates,
  searchFailoverEnabled,
  type ResolvedSecrets,
} from './select.ts'
import type {
  FetchProviderId,
  ProviderId,
  WebFetchProvider,
  WebFetchRequest,
  WebFetchResult,
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
} from './types.ts'
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
    case 'serper':
      return 'serperApiKey'
  }
}

export function missingCredential(id: ProviderId): never {
  const names = SECRET_ENVS[secretField(id)].map((name) => `"${name}"`).join(' or ')
  throw new WebError(
    `${id} has no API key for ${names}. ${KEY_HINT}`,
    'WEB_PROVIDER_CREDENTIAL_MISSING',
  )
}

export function missingAnyCredential(): never {
  throw new WebError(
    `No search backend has an API key (TAVILY_API_KEY, BAIDU_API_KEY, DOUBAO_API_KEY, EXA_API_KEY, or SERPER_API_KEY). ${KEY_HINT}`,
    'WEB_PROVIDER_CREDENTIAL_MISSING',
  )
}

export class PluginSearchProvider implements WebSearchProvider {
  readonly id = SEAM_PROVIDER_ID

  constructor(
    private readonly backends: Record<ProviderId, WebSearchProvider>,
    private readonly resolve: () => { config: Config; secrets: ResolvedSecrets },
    private readonly refresh: () => Promise<void>,
    private readonly logger?: Logger,
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
    const ids = searchCandidates(config, secrets)
    if (ids.length === 0) {
      if (config.searchProvider === 'auto') missingAnyCredential()
      missingCredential(config.searchProvider)
    }
    return firstSuccessful(
      ids,
      async (id) => {
        if (!providerUsable(id, config, secrets)) missingCredential(id)
        return this.backends[id].search(request, signal)
      },
      {
        failover: searchFailoverEnabled(config),
        signal,
        label: 'web_search',
        onSkip: (id, error) => this.warnSkip('web_search', id, error),
      },
    )
  }

  private warnSkip(label: string, id: string, error: unknown): void {
    const code = errorCode(error) ?? 'error'
    this.logger?.warn(`[dsh-web-search] ${label} ${id} failed (${code}), trying the next backend`)
  }
}

export class PluginFetchProvider implements WebFetchProvider {
  readonly id = SEAM_PROVIDER_ID

  constructor(
    private readonly backends: Record<FetchProviderId, WebFetchProvider>,
    private readonly resolve: () => { config: Config; secrets: ResolvedSecrets },
    private readonly refresh: () => Promise<void>,
    private readonly logger?: Logger,
  ) {}

  available(): boolean {
    const { config, secrets } = this.resolve()
    return fetchFacadeAvailable(config, secrets)
  }

  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    await this.refresh()
    const { config, secrets } = this.resolve()
    if (config.customSearch === false) {
      throw new WebError(
        'Custom search is off. Official web_fetch uses DSH built-in http.',
        'WEB_PROVIDER_CONFIGURED_UNAVAILABLE',
      )
    }
    if (fetchChoiceOf(config) === 'http') {
      throw new WebError(
        'Page extract is set to DSH built-in http.',
        'WEB_PROVIDER_CONFIGURED_UNAVAILABLE',
      )
    }
    const ids = fetchCandidates(config, secrets)
    if (ids.length === 0) {
      throw new WebError(
        'Page extract is only available when Tavily or Exa is selected for web_fetch. Otherwise web_fetch uses DSH built-in http.',
        'WEB_PROVIDER_CONFIGURED_UNAVAILABLE',
      )
    }
    return firstSuccessful(
      ids,
      async (id) => {
        if (!providerUsable(id, config, secrets)) missingCredential(id)
        return this.backends[id].fetch(request, signal)
      },
      {
        failover: fetchFailoverEnabled(config),
        signal,
        label: 'web_fetch',
        onSkip: (id, error) => {
          const code = errorCode(error) ?? 'error'
          this.logger?.warn(`[dsh-web-search] web_fetch ${id} failed (${code}), trying the next backend`)
        },
      },
    )
  }
}
