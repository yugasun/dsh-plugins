import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from './host.ts'
import { BaiduSearchProvider } from './baidu.ts'
import { Config, SETTINGS_NS } from './config.ts'
import { credentialOverlay, type Credentials } from './credentials.ts'
import { DoubaoSearchProvider } from './doubao.ts'
import { launchEnvLookup } from './env.ts'
import { ExaSearchProvider } from './exa.ts'
import type { HostContext } from './host-types.ts'
import { readHttpJson, requestMethod, type IncomingHttp } from './http-body.ts'
import { parseProbeProvider, probeProvider } from './probe.ts'
import { PluginFetchProvider, PluginSearchProvider } from './provider.ts'
import { mergeSecrets, pinWebSeams, pluginStatus, resolveSecrets, selectActive, type ResolvedSecrets } from './select.ts'
import { TavilySearchProvider } from './tavily.ts'

export const name = 'dsh-web-search'
export const inject = ['web']
export { Config, SETTINGS_NS }
export type { Config as WebSearchConfig } from './config.ts'

const NS = settingsNamespace(SETTINGS_NS)

export function apply(ctx: Context, config: Config): void {
  const host = ctx as unknown as HostContext
  let source = (): Config => config
  let overlay: Partial<ResolvedSecrets> = {}

  const resolve = () => {
    const current = source()
    return {
      config: current,
      secrets: mergeSecrets(resolveSecrets(current, launchEnvLookup(host)), overlay),
    }
  }

  const refreshOverlay = async () => {
    overlay = await credentialOverlay(host.get('credentials') as Credentials | undefined)
    pinSeam()
  }

  const pinSeam = () => pinWebSeams(host.web, source(), resolve().secrets)

  installSettingsSection(ctx, NS, Config, config, {
    setSource: (current) => {
      source = current
      pinSeam()
    },
    onChange: () => {
      pinSeam()
    },
  })
  pinSeam()

  const tavily = new TavilySearchProvider(resolve)
  const exa = new ExaSearchProvider(resolve)
  const backends = {
    baidu: new BaiduSearchProvider(resolve),
    doubao: new DoubaoSearchProvider(resolve),
    tavily,
    exa,
  }

  host.web.registerSearchProvider(new PluginSearchProvider(
    backends,
    resolve,
    refreshOverlay,
    host.logger,
  ))
  host.web.registerFetchProvider(new PluginFetchProvider(
    { tavily, exa },
    resolve,
    refreshOverlay,
    host.logger,
  ))

  void refreshOverlay()
  host.inject(['credentials'], (credCtx) => {
    void refreshOverlay()
    credCtx.on?.('credentials/updated', () => {
      void refreshOverlay()
    })
  })

  host.inject(['systemPrompt'], (promptCtx) => {
    promptCtx.systemPrompt?.section({
      name: 'plugin:dsh-web-search',
      order: 111,
      text: 'Use web_search for live lookup and web_fetch for page content. Settings → Web search chooses DSH built-in DeepSeek search or a custom backend (Baidu, Doubao, Tavily, Exa). web_fetch is chosen separately (auto follows Tavily/Exa search; or pin Tavily Extract, Exa Contents, or DSH http). Custom keys live there and are stripped from the shell. Do not curl Tavily or Exa, and do not look for TAVILY_API_KEY or EXA_API_KEY in env or config files.',
    })
  })

  host.inject(['webServer'], (serverCtx) => {
    const webServer = serverCtx.webServer
    if (!webServer) return
    host.effect(() => {
      const offStatus = webServer.register({
        kind: 'exact',
        path: '/dsh-web-search/status',
        handler: (_req, res) => {
          res.statusCode = 200
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.setHeader('cache-control', 'no-store')
          res.end(JSON.stringify(pluginStatus(resolve().config, resolve().secrets)))
        },
      })
      const offProbe = webServer.register({
        kind: 'exact',
        path: '/dsh-web-search/probe',
        handler: (req, res) => {
          void (async () => {
            res.setHeader('content-type', 'application/json; charset=utf-8')
            res.setHeader('cache-control', 'no-store')
            const incoming = req as IncomingHttp
            if (requestMethod(incoming) !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ ok: false, error: 'POST only' }))
              return
            }
            await refreshOverlay()
            const { config, secrets } = resolve()
            let body: unknown = {}
            try {
              body = await readHttpJson(incoming)
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'invalid JSON' }))
              return
            }
            const requested = parseProbeProvider(
              body && typeof body === 'object' && 'provider' in body
                ? (body as { provider?: unknown }).provider
                : undefined,
            )
            const id = requested ?? selectActive(config, secrets)
            if (id == null) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'no usable search backend' }))
              return
            }
            const result = await probeProvider(backends, config, secrets, id)
            res.statusCode = result.ok ? 200 : 502
            res.end(JSON.stringify(result))
          })()
        },
      })
      return () => {
        offStatus()
        offProbe()
      }
    }, 'dsh-web-search: http')
  })

  host.logger?.info?.('[dsh-web-search] search/fetch facade registered as dsh-web-search')
}
