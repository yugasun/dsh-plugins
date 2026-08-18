import { createElement as h } from 'react'
import { SearchCard } from './SearchCard.tsx'
import type { ClientConfig, SettingsScope } from './model.ts'

interface SearchPageProps {
  t: (key: string) => string
  scope: SettingsScope<ClientConfig>
}

export function SearchPage(props: SearchPageProps) {
  return h(
    'section',
    { className: 'dshWebSearchPage' },
    h('h2', { className: 'dshWebSearchPage-heading' }, props.t('title')),
    h('p', { className: 'dshWebSearchPage-intro' }, props.t('blurb')),
    h(SearchCard, props),
  )
}
