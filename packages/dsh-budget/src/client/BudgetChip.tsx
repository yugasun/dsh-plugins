import { createElement as h, useEffect, useRef, useState } from 'react'
import { MeterBars } from './MeterBars.tsx'
import { formatTokens, type ClientConfig, type SettingsScope } from './model.ts'
import { useBudgetStats } from './useBudgetStats.ts'
import { useSettingsScope } from './useSettingsScope.ts'

const RADIUS = 10
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface BudgetChipProps {
  t: (key: string) => string
  scope: SettingsScope<ClientConfig>
}

export function BudgetChip(props: BudgetChipProps) {
  const snap = useSettingsScope(props.scope)
  const value = snap.value
  const stats = useBudgetStats()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const enabled = value?.enabled !== false
  const cap = value?.toolResultMaxTokens ?? 4000
  const trimmed = Boolean(stats.lastPlan && stats.lastPlan.savedTokens > 0)
  const ratio = enabled && trimmed && stats.lastPlan
    ? Math.min(1, stats.lastPlan.savedTokens / Math.max(stats.lastPlan.beforeTokens, 1))
    : 0
  const dash = CIRCUMFERENCE * ratio
  const fillClass = !enabled
    ? 'dshBudgetChip-fill is-off'
    : trimmed
      ? 'dshBudgetChip-fill is-saved'
      : 'dshBudgetChip-fill'
  const figures = enabled ? formatTokens(cap) : props.t('chipOff')
  const chipLabel = `${props.t('chipShort')} ${figures}`

  return h(
    'div',
    { className: 'dshBudgetChip', ref: rootRef },
    h(
      'button',
      {
        type: 'button',
        className: 'dshBudgetChip-trigger',
        'aria-label': `${props.t('chipAria')}: ${figures}`,
        'aria-expanded': open,
        onClick: () => setOpen((next) => !next),
      },
      h(
        'svg',
        { width: 22, height: 22, viewBox: '0 0 22 22', 'aria-hidden': true },
        h('circle', { className: 'dshBudgetChip-track', cx: 11, cy: 11, r: RADIUS }),
        h('circle', {
          className: fillClass,
          cx: 11,
          cy: 11,
          r: RADIUS,
          transform: 'rotate(-90 11 11)',
          strokeDasharray: `${dash} ${CIRCUMFERENCE}`,
        }),
      ),
      h('span', { className: 'dshBudgetChip-label' }, chipLabel),
    ),
    open
      ? h(
          'div',
          { className: 'dshBudgetChip-panel', role: 'dialog', 'aria-label': props.t('title') },
          h(
            'div',
            { className: 'dshBudgetChip-header' },
            h('span', null, props.t('title')),
            h('span', { className: 'dshBudgetChip-figures' }, figures),
          ),
          h(
            'label',
            { className: 'dshBudgetChip-toggle' },
            h('input', {
              type: 'checkbox',
              checked: enabled,
              disabled: !value || !snap.writable,
              onChange: (event: { currentTarget: { checked: boolean } }) => {
                void props.scope.set('enabled', event.currentTarget.checked)
              },
            }),
            h('span', null, props.t('enabled')),
          ),
          h(
            'div',
            { className: 'dshBudgetChip-meta' },
            h('span', null, `${props.t('saved')}: ${formatTokens(stats.savedTokens)}`),
            h('span', null, `${props.t('spills')}: ${stats.spillCount}`),
          ),
          stats.lastPlan
            ? h(MeterBars, { before: stats.lastPlan.beforeTokens, after: stats.lastPlan.afterTokens, t: props.t })
            : h('div', { className: 'dshBudgetChip-empty' }, props.t('idle')),
        )
      : null,
  )
}
