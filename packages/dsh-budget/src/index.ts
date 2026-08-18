import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { Config, SETTINGS_NS } from './config.ts'
import { registerPostExecute } from './hooks/post-execute.ts'
import type { HostContext } from './host-types.ts'
import { StatsStore } from './stats.ts'

export const name = 'dsh-budget'
export const inject = ['tools']
export { Config, SETTINGS_NS }
export type { Config as BudgetConfig } from './config.ts'

const NS = settingsNamespace(SETTINGS_NS)

export function apply(ctx: Context, config: Config): void {
  const host = ctx as unknown as HostContext
  const stats = new StatsStore()
  let source = (): Config => config

  installSettingsSection(ctx, NS, Config, config, {
    setSource: (current) => {
      source = current
    },
    onChange: () => {
      source()
    },
  })

  registerPostExecute(host, source, stats)

  host.inject(['webServer'], (serverCtx) => {
    const webServer = serverCtx.webServer
    if (!webServer) return
    const json = (
      res: { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void },
      body: unknown,
    ) => {
      res.statusCode = 200
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.setHeader('cache-control', 'no-store')
      res.end(JSON.stringify(body))
    }
    host.effect(
      () =>
        webServer.register({
          kind: 'exact',
          path: '/dsh-budget/stats',
          handler: (_req, res) => json(res, stats.snapshot()),
        }),
      'dsh-budget: http',
    )
  })

  host.logger?.info?.('[dsh-budget] tool-result cap plugin loaded')
}
