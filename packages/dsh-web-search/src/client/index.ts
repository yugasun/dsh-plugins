import { createElement as h } from 'react'
import { en, zh } from './locales.ts'
import type { ClientConfig, SettingsScope } from './model.ts'
import { watchSettingsNavIcon } from './nav-icon.ts'
import { SearchPage } from './SearchPage.tsx'
import { ensureSearchStyles } from './styles.ts'

const NS = 'dsh-web-search'

interface LocaleService {
  register(namespace: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): unknown
  bind(namespace: string): (key: string) => string
}

interface SettingsScopeBinder {
  bind<T>(spec: { namespace: string }): SettingsScope<T>
}

interface SlotsService {
  inject(slot: string, register: () => unknown): void
  register(meta: Record<string, unknown>, component: unknown): unknown
}

interface ClientContext {
  effect(callback: () => unknown, label?: string): void
  locale: LocaleService
  slots: SlotsService
  settingsScope: SettingsScopeBinder
}

export const name = 'dsh-web-search'
export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-web-search: dictionaries')
  ctx.effect(() => ensureSearchStyles(), 'dsh-web-search: styles')
  ctx.effect(() => watchSettingsNavIcon(), 'dsh-web-search: nav icon')
  const t = ctx.locale.bind(NS)
  const scope = ctx.settingsScope.bind<ClientConfig>({ namespace: NS })

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: NS,
        order: 17,
        label: () => t('title'),
        locale: NS,
      },
      () => h(SearchPage, { t, scope }),
    ),
  )
}
