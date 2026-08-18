import { createElement as h, type ReactNode } from 'react'
import { MeterBars } from './MeterBars.tsx'
import type { ClientConfig, SettingsScope } from './model.ts'
import { formatTokens } from './model.ts'
import { useBudgetStats } from './useBudgetStats.ts'
import { useSettingsScope } from './useSettingsScope.ts'

interface BudgetCardProps {
  t: (key: string, params?: Record<string, string | number>) => string
  scope: SettingsScope<ClientConfig>
}

function Setting(props: {
  label: string
  hint: string
  children?: ReactNode
}) {
  return h(
    'div',
    { className: 'dshBudgetField' },
    h('div', { className: 'dshBudgetField-label' }, props.label),
    h('p', { className: 'dshBudgetField-hint' }, props.hint),
    props.children,
  )
}

function NumberField(props: {
  value: number
  min: number
  disabled: boolean
  unit: string
  aside: string
  onChange: (value: number) => void
}) {
  return h(
    'div',
    { className: 'dshBudgetField-control' },
    h('input', {
      type: 'number',
      min: props.min,
      value: props.value,
      disabled: props.disabled,
      onChange: (event: { currentTarget: { value: string } }) => {
        const next = Number(event.currentTarget.value)
        if (Number.isFinite(next)) props.onChange(Math.max(props.min, Math.round(next)))
      },
      className: 'dshBudgetField-input',
    }),
    h('span', { className: 'dshBudgetField-unit' }, props.unit),
    h('span', { className: 'dshBudgetField-aside' }, props.aside),
  )
}

export function BudgetCard(props: BudgetCardProps) {
  const snap = useSettingsScope(props.scope)
  const value = snap.value
  const stats = useBudgetStats()

  if (!value) {
    return h('div', { className: 'dshBudgetStatus-empty' }, props.t('loading'))
  }

  const disabled = !snap.writable
  const plan = stats.lastPlan
  const chars = (tokens: number) => props.t('aboutChars', { n: (tokens * 4).toLocaleString() })

  return h(
    'div',
    { className: 'dshBudgetForm' },
    h(
      Setting,
      { label: props.t('enabled'), hint: props.t('enabledHint') },
      h(
        'label',
        { className: 'dshBudgetToggle' },
        h('input', {
          type: 'checkbox',
          checked: value.enabled,
          disabled,
          onChange: (event: { currentTarget: { checked: boolean } }) => {
            void props.scope.set('enabled', event.currentTarget.checked)
          },
        }),
        h('span', null, value.enabled ? props.t('chipShort') : props.t('chipOff')),
      ),
    ),
    h(
      Setting,
      { label: props.t('toolResult'), hint: props.t('toolResultHint') },
      h(NumberField, {
        value: value.toolResultMaxTokens,
        min: 256,
        disabled,
        unit: props.t('unitTokens'),
        aside: chars(value.toolResultMaxTokens),
        onChange: (next) => void props.scope.set('toolResultMaxTokens', next),
      }),
    ),
    h(
      'section',
      { className: 'dshBudgetStatus' },
      h('div', { className: 'dshBudgetStatus-title' }, props.t('statusTitle')),
      h(
        'div',
        { className: 'dshBudgetStatus-meta' },
        h('span', null, `${props.t('saved')} ${formatTokens(stats.savedTokens)}`),
        h('span', null, `${props.t('spills')} ${stats.spillCount}`),
      ),
      plan
        ? h(
            'div',
            null,
            h('div', { className: 'dshBudgetStatus-title' }, props.t('lastPlan')),
            h(MeterBars, { before: plan.beforeTokens, after: plan.afterTokens, t: props.t }),
          )
        : h('p', { className: 'dshBudgetStatus-empty' }, props.t('empty')),
      stats.caps && stats.caps.toolResultMaxTokens !== value.toolResultMaxTokens
        ? h(
            'p',
            { className: 'dshBudgetStatus-empty' },
            props.t('hostCaps', {
              tool: formatTokens(stats.caps.toolResultMaxTokens),
            }),
          )
        : null,
    ),
  )
}
