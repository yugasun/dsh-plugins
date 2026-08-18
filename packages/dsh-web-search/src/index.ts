import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { BaiduSearchProvider } from './baidu.ts'
import { Config, SETTINGS_NS } from './config.ts'
import { credentialOverlay, type Credentials } from './credentials.ts'
import { DoubaoSearchProvider } from './doubao.ts'
import { launchEnvLookup } from './env.ts'
import { ExaSearchProvider } from './exa.ts'
import type { HostContext } from './host-types.ts'
import { PluginSearchProvider } from './provider.ts'
import { mergeSecrets, pinWebSearchProvider, pluginStatus, resolveSecrets, type ResolvedSecrets } from './select.ts'
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
  }

  const pinSeam = () => pinWebSearchProvider(host.web, source())

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

  host.web.registerSearchProvider(new PluginSearchProvider(
    {
      baidu: new BaiduSearchProvider(resolve),
      doubao: new DoubaoSearchProvider(resolve),
      tavily: new TavilySearchProvider(resolve),
      exa: new ExaSearchProvider(resolve),
    },
    resolve,
    refreshOverlay,
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
      text: 'Use the web_search tool for live web lookup. Settings → Web search chooses DSH built-in DeepSeek search or a custom backend (Baidu, Doubao, Tavily, Exa). Custom keys live there and are stripped from the shell. Do not curl Tavily, and do not look for TAVILY_API_KEY in env or config files.',
    })
  })

  host.inject(['webServer'], (serverCtx) => {
    const webServer = serverCtx.webServer
    if (!webServer) return
    host.effect(() => webServer.register({
      kind: 'exact',
      path: '/dsh-web-search/status',
      handler: (_req, res) => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.setHeader('cache-control', 'no-store')
        res.end(JSON.stringify(pluginStatus(resolve().config, resolve().secrets)))
      },
    }), 'dsh-web-search: http')
  })

  host.logger?.info?.('[dsh-web-search] search facade registered as dsh-web-search')
}
