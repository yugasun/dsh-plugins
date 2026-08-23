import {
  SearchAbortedError,
  SearchSuite,
  SearchSuiteError,
  type ProviderConfigMap,
  type ProviderSearchRequest,
  type SearchResponse,
} from 'searchsuite'
import type { WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import { doubaoBaseUrlOf, baiduSearchModeOf, doubaoSearchModeOf, type Config } from './config.ts'
import { abortSearch, providerFailed } from './errors.ts'
import { isSelected, type ResolvedSecrets } from './select.ts'
import type { ProviderId } from './types.ts'

const RESULT_LIMITS: Record<ProviderId, number> = {
  baidu: 50,
  doubao: 50,
  tavily: 20,
  exa: 100,
  serper: 100,
}

function resultLimit(id: ProviderId, config: Config): number {
  if (id === 'baidu') return baiduSearchModeOf(config) === 'ai' ? 20 : RESULT_LIMITS.baidu
  if (id === 'doubao') return doubaoSearchModeOf(config) === 'global' ? 20 : RESULT_LIMITS.doubao
  return RESULT_LIMITS[id]
}

function sourceFrom(result: SearchResponse['results'][number]): WebSearchSource {
  return {
    url: result.url,
    title: result.title,
    ...(result.snippet ?? result.content
      ? { snippet: result.snippet ?? result.content }
      : {}),
    ...(result.publishedAt === undefined ? {} : { publishedAt: result.publishedAt }),
  }
}

function mapResponse(
  response: SearchResponse,
  provider: ProviderId,
  config: Config,
  requestedMaxResults: number | undefined,
): WebSearchResult {
  const requested = requestedMaxResults ?? 10
  const effectiveMax = Math.min(requested, resultLimit(provider, config))
  return {
    ...(response.answer === undefined ? {} : { content: response.answer }),
    sources: response.results.map(sourceFrom),
    truncated: response.results.length >= effectiveMax,
  }
}

export function providerConfig(config: Config, secrets: ResolvedSecrets): ProviderConfigMap {
  return {
    baidu: {
      apiKey: secrets.baiduApiKey,
      baseUrl: config.baiduBaseURL,
      model: config.baiduModel,
    },
    doubao: {
      apiKey: secrets.doubaoApiKey,
      baseUrl: doubaoBaseUrlOf(config),
    },
    tavily: {
      apiKey: secrets.tavilyApiKey,
      baseUrl: config.tavilyBaseURL,
    },
    exa: {
      apiKey: secrets.exaApiKey,
      baseUrl: config.exaBaseURL,
    },
    serper: {
      apiKey: secrets.serperApiKey,
      baseUrl: config.serperBaseURL,
    },
  }
}

function requestFor(
  provider: ProviderId,
  config: Config,
  request: WebSearchRequest,
  signal: AbortSignal | undefined,
): ProviderSearchRequest {
  const common = {
    query: request.query,
    ...(request.maxResults === undefined ? {} : { maxResults: request.maxResults }),
    ...(signal === undefined ? {} : { signal }),
  }

  switch (provider) {
    case 'baidu': {
      const mode = baiduSearchModeOf(config)
      return {
        ...common,
        provider,
        providerOptions: mode === 'ai'
          ? { mode, model: config.baiduModel }
          : { mode },
      }
    }
    case 'doubao': {
      const mode = doubaoSearchModeOf(config)
      return {
        ...common,
        provider,
        providerOptions: mode === 'custom'
          ? { mode, needSummary: true }
          : { mode, maxSnippetLength: 1000 },
      }
    }
    case 'tavily':
      return {
        ...common,
        provider,
        providerOptions: {
          searchDepth: config.tavilySearchDepth,
          includeAnswer: true,
          includeRawContent: false,
        },
      }
    case 'exa':
      return {
        ...common,
        provider,
        providerOptions: {
          searchType: config.exaSearchType,
          highlightsPerUrl: config.exaHighlightsPerResult,
        },
      }
    case 'serper': {
      const options = {
        ...(config.serperGl.trim() ? { gl: config.serperGl } : {}),
        ...(config.serperHl.trim() ? { hl: config.serperHl } : {}),
      }
      return {
        ...common,
        provider,
        ...(Object.keys(options).length === 0 ? {} : { providerOptions: options }),
      }
    }
  }
}

export class SearchSuiteSearchProvider implements WebSearchProvider {
  readonly id: ProviderId

  constructor(
    provider: ProviderId,
    private readonly resolve: () => { config: Config; secrets: ResolvedSecrets },
  ) {
    this.id = provider
  }

  available(): boolean {
    const { config, secrets } = this.resolve()
    return isSelected(this.id, config, secrets)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const { config, secrets } = this.resolve()
    const searchRequest = requestFor(this.id, config, request, signal)
    try {
      const response = await new SearchSuite({ providers: providerConfig(config, secrets) }).search(searchRequest)
      return mapResponse(response, this.id, config, request.maxResults)
    } catch (error: unknown) {
      if (error instanceof SearchAbortedError || signal?.aborted) {
        abortSearch(this.id, error)
      }
      const message = error instanceof SearchSuiteError ? error.message : 'request failed'
      providerFailed(`${this.id} search failed: ${message}`, error)
    }
  }
}
