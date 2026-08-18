import { createElement as h } from 'react'
import { BudgetCard } from './BudgetCard.tsx'
import type { ClientConfig, SettingsScope } from './model.ts'

interface BudgetPageProps {
  t: (key: string, params?: Record<string, string | number>) => string
  scope: SettingsScope<ClientConfig>
}

export function BudgetPage(props: BudgetPageProps) {
  return h(
    'section',
    { className: 'dshBudgetPage' },
    h('h2', { className: 'dshBudgetPage-heading' }, props.t('title')),
    h('p', { className: 'dshBudgetPage-intro' }, props.t('blurb')),
    h(BudgetCard, props),
  )
}
