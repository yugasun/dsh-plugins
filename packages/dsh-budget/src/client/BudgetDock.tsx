import { createElement as h } from 'react'
import { formatTokens, type ClientConfig, type SettingsScope } from './model.ts'
import { useBudgetStats } from './useBudgetStats.ts'
import { useSettingsScope } from './useSettingsScope.ts'

interface BudgetDockProps {
  t: (key: string) => string
  scope: SettingsScope<ClientConfig>
}

export function BudgetDock(props: BudgetDockProps) {
  const snap = useSettingsScope(props.scope)
  const value = snap.value
  const stats = useBudgetStats()
  const plan = stats.lastPlan

  if (!value?.enabled || !plan || plan.savedTokens <= 0) return null

  const groups = [
    `${props.t('title')} ${formatTokens(plan.beforeTokens)} → ${formatTokens(plan.afterTokens)}`,
    `${props.t('saved')} ${formatTokens(stats.savedTokens)}`,
  ]
  if (stats.spillCount > 0) groups.push(`${props.t('spills')} ${stats.spillCount}`)

  return h(
    'div',
    { className: 'dshBudgetDock' },
    ...groups.flatMap((group, index) =>
      index === 0
        ? [group]
        : [h('span', { className: 'dshBudgetDock-sep', 'aria-hidden': true, key: `sep-${index}` }, '|'), ` ${group}`],
    ),
  )
}
