import { createElement as h, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import type { ProviderId } from './model.ts'
import { VENDOR_ORDER, vendorTabLayout } from './model.ts'

const TAB_ESTIMATE_PX = 96
const MORE_ESTIMATE_PX = 52

function useMaxVisibleTabs(vendorCount: number) {
  const barRef = useRef<HTMLDivElement>(null)
  const [maxVisible, setMaxVisible] = useState(vendorCount)

  useEffect(() => {
    const el = barRef.current
    if (!el || vendorCount === 0) return

    const measure = () => {
      const width = el.clientWidth
      if (width <= 0) return
      const slotsWithoutMore = Math.floor(width / TAB_ESTIMATE_PX)
      if (slotsWithoutMore >= vendorCount) {
        setMaxVisible(vendorCount)
        return
      }
      const slotsWithMore = Math.floor((width - MORE_ESTIMATE_PX) / TAB_ESTIMATE_PX)
      if (slotsWithMore < 1) {
        setMaxVisible(0)
        return
      }
      setMaxVisible(Math.min(slotsWithMore, vendorCount))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [vendorCount])

  return { barRef, maxVisible }
}

export function EngineTabs(props: {
  selected: ProviderId
  disabled: boolean
  t: (key: string) => string
  badgeOf: (id: ProviderId) => string
  kindOf: (id: ProviderId) => 'on' | 'ready' | 'off'
  onSelect: (id: ProviderId) => void
  panelRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  const vendors = VENDOR_ORDER
  const { barRef, maxVisible } = useMaxVisibleTabs(vendors.length)
  const layout = vendorTabLayout(vendors, props.selected, maxVisible)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const moreBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!moreOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMoreOpen(false)
        moreBtnRef.current?.focus()
      }
    }
    const onPointer = (event: MouseEvent) => {
      const root = moreRef.current
      if (root && !root.contains(event.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [moreOpen])

  const tabIds = layout.scrollAll ? vendors : layout.visible
  const showMore = layout.overflow.length > 0

  const moveTab = (delta: number) => {
    if (props.disabled || tabIds.length === 0) return
    const index = tabIds.indexOf(props.selected)
    const base = index >= 0 ? index : 0
    const next = tabIds[(base + delta + tabIds.length) % tabIds.length]
    props.onSelect(next)
  }

  const selectFromMore = (id: ProviderId) => {
    props.onSelect(id)
    setMoreOpen(false)
    moreBtnRef.current?.focus()
    requestAnimationFrame(() => props.panelRef.current?.focus())
  }

  const tabButton = (id: ProviderId) => {
    const selected = props.selected === id
    const kind = props.kindOf(id)
    return h(
      'button',
      {
        type: 'button',
        key: id,
        id: `dsh-web-search-tab-${id}`,
        role: 'tab',
        'aria-selected': selected,
        tabIndex: selected ? 0 : -1,
        className: `dshWebSearchTab${selected ? ' is-on' : ''}${kind === 'on' ? ' is-active-vendor' : ''}`,
        disabled: props.disabled,
        onClick: () => {
          if (props.selected !== id) props.onSelect(id)
        },
      },
      h('span', { className: 'dshWebSearchTab-name' }, props.t(id)),
      h('span', { className: `dshWebSearchTab-badge is-${kind}` }, props.badgeOf(id)),
    )
  }

  return h(
    'div',
    { className: 'dshWebSearchTabs' },
    h(
      'div',
      {
        ref: barRef,
        className: `dshWebSearchTabs-bar${layout.scrollAll ? ' is-scroll' : ''}`,
      },
      h(
        'div',
        {
          className: 'dshWebSearchTabs-strip',
          role: 'tablist',
          'aria-label': props.t('keysHeading'),
          onKeyDown: (event: { key: string; preventDefault(): void }) => {
            if (props.disabled) return
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
              event.preventDefault()
              moveTab(1)
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
              event.preventDefault()
              moveTab(-1)
            }
          },
        },
        ...tabIds.map(tabButton),
      ),
      showMore
        ? h(
          'div',
          { ref: moreRef, className: 'dshWebSearchTabs-moreWrap' },
          h(
            'button',
            {
              ref: moreBtnRef,
              type: 'button',
              className: `dshWebSearchTabs-more${moreOpen ? ' is-open' : ''}`,
              'aria-expanded': moreOpen,
              'aria-haspopup': 'menu',
              disabled: props.disabled,
              onClick: () => setMoreOpen((open) => !open),
            },
            props.t('more'),
          ),
          moreOpen
            ? h(
              'ul',
              {
                className: 'dshWebSearchTabs-menu',
                role: 'menu',
              },
              ...layout.overflow.map((id) =>
                h(
                  'li',
                  { key: id, role: 'none' },
                  h(
                    'button',
                    {
                      type: 'button',
                      role: 'menuitem',
                      className: `dshWebSearchTabs-menuItem${props.selected === id ? ' is-on' : ''}`,
                      onClick: () => selectFromMore(id),
                    },
                    h('span', { className: 'dshWebSearchTabs-menuName' }, props.t(id)),
                    h('span', { className: `dshWebSearchTab-badge is-${props.kindOf(id)}` }, props.badgeOf(id)),
                  ),
                ),
              ),
            )
            : null,
        )
        : null,
    ),
    h(
      'div',
      {
        ref: props.panelRef,
        id: `dsh-web-search-panel-${props.selected}`,
        className: 'dshWebSearchPanel',
        role: 'tabpanel',
        tabIndex: -1,
        'aria-labelledby': `dsh-web-search-tab-${props.selected}`,
      },
      props.children,
    ),
  )
}
