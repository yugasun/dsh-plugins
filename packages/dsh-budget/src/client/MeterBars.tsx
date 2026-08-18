import { createElement as h } from 'react'
import { formatTokens } from './model.ts'

export function MeterBars(props: {
  before: number
  after: number
  t: (key: string) => string
}) {
  const max = Math.max(props.before, 1)
  const beforePct = Math.min(100, (props.before / max) * 100)
  const afterPct = Math.min(100, (props.after / max) * 100)
  return h(
    'div',
    { className: 'dshBudgetBar' },
    h('div', { className: 'dshBudgetBar-label' }, `${props.t('before')} ${formatTokens(props.before)}`),
    h('div', { className: 'dshBudgetBar-track' }, h('div', { className: 'dshBudgetBar-fill', style: { width: `${beforePct}%`, opacity: 0.35 } })),
    h('div', { className: 'dshBudgetBar-label' }, `${props.t('after')} ${formatTokens(props.after)}`),
    h('div', { className: 'dshBudgetBar-track' }, h('div', { className: 'dshBudgetBar-fill is-after', style: { width: `${afterPct}%` } })),
  )
}
