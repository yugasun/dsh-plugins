import { createElement as h } from 'react'
import { BudgetChip } from './BudgetChip.tsx'
import { BudgetDock } from './BudgetDock.tsx'
import { BudgetPage } from './BudgetPage.tsx'
import { en, zh } from './locales.ts'
import type { ClientConfig } from './model.ts'
import { ensureBudgetStyles } from './styles.ts'

const NS = 'dsh-budget'

interface LocaleService {
  register(namespace: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): unknown
  bind(namespace: string): (key: string, params?: Record<string, string | number>) => string
}

interface SettingsScopeBinder {
  bind<T>(spec: { namespace: string }): {
    getSnapshot(): { status: string; value: T | undefined; writable: boolean }
    subscribe(listener: () => void): () => void
    set(field: string, value: unknown): Promise<void>
  }
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

export const name = 'dsh-budget'
export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-budget: dictionaries')
  ctx.effect(() => ensureBudgetStyles(), 'dsh-budget: styles')
  const t = ctx.locale.bind(NS)
  const scope = ctx.settingsScope.bind<ClientConfig>({ namespace: NS })

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: NS,
        order: 18,
        label: () => t('title'),
        locale: NS,
      },
      () => h(BudgetPage, { t, scope }),
    ),
  )

  ctx.slots.inject('conversation.input.left', () =>
    ctx.slots.register(
      {
        name: 'conversation.input.left',
        id: NS,
        order: 20,
        label: () => t('title'),
      },
      () => h(BudgetChip, { t, scope }),
    ),
  )

  ctx.slots.inject('conversation.composer.dock', () =>
    ctx.slots.register(
      {
        name: 'conversation.composer.dock',
        id: NS,
        order: 10,
        label: () => t('title'),
      },
      () => h(BudgetDock, { t, scope }),
    ),
  )
}
