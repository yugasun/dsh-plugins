import { createElement as h, useRef, useState, type ReactNode } from 'react'
import type { ClientConfig, FetchProviderChoice, ProbeResult, ProviderId, SearchProviderChoice, SettingsScope } from './model.ts'
import { FETCH_OPTIONS, PROVIDER_OPTIONS } from './model.ts'
import { secretCommit, secretDisplay } from './secret-field.ts'
import { useSearchStatus } from './useSearchStatus.ts'
import { useSettingsScope } from './useSettingsScope.ts'

interface SearchCardProps {
  t: (key: string) => string
  scope: SettingsScope<ClientConfig>
}

function Field(props: {
  label: string
  hint?: string
  children?: ReactNode
}) {
  return h(
    'div',
    { className: 'dshWebSearchField' },
    h('div', { className: 'dshWebSearchField-label' }, props.label),
    props.hint ? h('p', { className: 'dshWebSearchField-hint' }, props.hint) : null,
    props.children,
  )
}

function SecretField(props: {
  configured: boolean
  savedLabel: string
  placeholder?: string
  disabled: boolean
  onSave: (value: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft
  return h(
    'div',
    { className: 'dshWebSearchSecret' },
    h('input', {
      type: 'password',
      className: 'dshWebSearchField-input',
      value: secretDisplay(draft, props.configured),
      placeholder: props.placeholder,
      autoComplete: 'new-password',
      spellCheck: false,
      disabled: props.disabled,
      onFocus: (event: { currentTarget: { select(): void } }) => {
        event.currentTarget.select()
      },
      onChange: (event: { currentTarget: { value: string } }) => {
        const next = event.currentTarget.value
        draftRef.current = next
        setDraft(next)
      },
      onBlur: () => {
        const current = draftRef.current
        if (current === null) return
        const commit = secretCommit(current)
        draftRef.current = null
        setDraft(null)
        if (commit.kind === 'set') props.onSave(commit.value)
      },
    }),
    props.configured && draft === null
      ? h('span', { className: 'dshWebSearchSecret-saved' }, props.savedLabel)
      : null,
  )
}

function TextField(props: {
  value?: string
  placeholder?: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return h('input', {
    type: 'text',
    className: 'dshWebSearchField-input',
    value: props.value ?? '',
    placeholder: props.placeholder,
    autoComplete: 'off',
    spellCheck: false,
    disabled: props.disabled,
    onChange: (event: { currentTarget: { value: string } }) => props.onChange(event.currentTarget.value),
  })
}

function SelectField(props: {
  value: string
  disabled: boolean
  options: Array<{ id: string; label: string }>
  onChange: (value: string) => void
}) {
  return h(
    'select',
    {
      className: 'dshWebSearchField-input',
      value: props.value,
      disabled: props.disabled,
      onChange: (event: { currentTarget: { value: string } }) => props.onChange(event.currentTarget.value),
    },
    ...props.options.map((option) => h('option', { key: option.id, value: option.id }, option.label)),
  )
}

function Tabs(props: {
  value: string
  disabled: boolean
  options: Array<{ id: string; label: string }>
  onChange: (value: string) => void
}) {
  return h(
    'div',
    { className: 'dshWebSearchTabs', role: 'tablist' },
    ...props.options.map((option) =>
      h(
        'button',
        {
          type: 'button',
          key: option.id,
          role: 'tab',
          'aria-selected': props.value === option.id,
          className: `dshWebSearchTabs-item${props.value === option.id ? ' is-on' : ''}`,
          disabled: props.disabled,
          onClick: () => {
            if (props.value !== option.id) props.onChange(option.id)
          },
        },
        option.label,
      ),
    ),
  )
}

function ProbeButton(props: {
  id: ProviderId
  configured: boolean
  disabled: boolean
  t: (key: string) => string
}) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ProbeResult | 'need-key' | null>(null)

  const run = () => {
    if (!props.configured) {
      setResult('need-key')
      return
    }
    setBusy(true)
    setResult(null)
    void fetch('/dsh-web-search/probe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: props.id }),
    })
      .then(async (response) => {
        const body = await response.json() as ProbeResult
        setResult(body)
      })
      .catch((error: unknown) => {
        setResult({
          ok: false,
          provider: props.id,
          error: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => setBusy(false))
  }

  const message = result === 'need-key'
    ? props.t('testNeedKey')
    : result == null
      ? null
      : result.ok
        ? `${props.t('testOk')} · ${result.sources ?? 0}`
        : `${props.t('testFail')}: ${result.error ?? result.code ?? ''}`

  return h(
    'div',
    { className: 'dshWebSearchProbe' },
    h(
      'button',
      {
        type: 'button',
        className: 'dshWebSearchProbe-btn',
        disabled: props.disabled || busy,
        onClick: run,
      },
      busy ? props.t('testing') : props.t('testConnection'),
    ),
    message
      ? h(
        'p',
        {
          className: `dshWebSearchProbe-msg${result !== 'need-key' && result?.ok ? ' is-ok' : ' is-bad'}`,
        },
        message,
      )
      : null,
  )
}

function ProviderCard(props: {
  title: string
  description: string
  badge: string
  kind: 'on' | 'ready' | 'off'
  open: boolean
  onToggle: () => void
  children?: ReactNode
}) {
  return h(
    'section',
    { className: `dshWebSearchCard${props.kind === 'on' ? ' is-on' : ''}${props.open ? ' is-open' : ''}` },
    h(
      'button',
      {
        type: 'button',
        className: 'dshWebSearchCard-head',
        'aria-expanded': props.open,
        onClick: props.onToggle,
      },
      h(
        'span',
        { className: 'dshWebSearchCard-text' },
        h('span', { className: 'dshWebSearchCard-name' }, props.title),
        h('span', { className: 'dshWebSearchCard-desc' }, props.description),
      ),
      h('span', { className: `dshWebSearchCard-badge is-${props.kind}` }, props.badge),
      h('span', { className: `dshWebSearchCard-chevron${props.open ? ' is-open' : ''}`, 'aria-hidden': true }),
    ),
    props.open ? h('div', { className: 'dshWebSearchCard-body' }, props.children) : null,
  )
}

export function SearchCard(props: SearchCardProps) {
  const snap = useSettingsScope(props.scope)
  const value = snap.value
  const { status, refresh } = useSearchStatus()
  const [openId, setOpenId] = useState<ProviderId | null | 'init'>('init')

  if (!value) {
    return h('p', { className: 'dshWebSearchStatus-empty' }, props.t('loading'))
  }

  const disabled = !snap.writable
  const custom = value.customSearch !== false
  const configured = (id: ProviderId) =>
    status.providers.find((provider) => provider.id === id)?.configured === true
  const set = (field: string, next: unknown) => {
    void props.scope.set(field, next).then(() => refresh())
  }
  const preferred: ProviderId | null = value.searchProvider === 'auto'
    ? status.active
    : value.searchProvider
  const open = !custom ? null : openId === 'init' ? preferred : openId
  const kindOf = (id: ProviderId): 'on' | 'ready' | 'off' => {
    if (custom && status.active === id) return 'on'
    if (configured(id)) return 'ready'
    return 'off'
  }
  const badgeOf = (id: ProviderId) => {
    const kind = kindOf(id)
    if (kind === 'on') return props.t('active')
    if (kind === 'ready') return props.t('ready')
    return props.t('missing')
  }
  const toggle = (id: ProviderId) => {
    setOpenId(open === id ? null : id)
  }

  return h(
    'div',
    { className: 'dshWebSearchForm' },
    h(Field, {
      label: props.t('customSearch'),
      hint: props.t('customSearchHint'),
      children: h(
        'label',
        { className: 'dshWebSearchToggle' },
        h('input', {
          type: 'checkbox',
          checked: custom,
          disabled,
          onChange: (event: { currentTarget: { checked: boolean } }) => {
            set('customSearch', event.currentTarget.checked)
          },
        }),
        h('span', null, custom ? props.t('customOn') : props.t('customOff')),
      ),
    }),
    custom
      ? [
          h(Field, {
            key: 'provider',
            label: props.t('provider'),
            hint: props.t('providerHint'),
            children: [
              h(Tabs, {
                key: 'tabs',
                value: value.searchProvider,
                disabled,
                options: PROVIDER_OPTIONS.map((option) => ({ id: option.id, label: props.t(option.labelKey) })),
                onChange: (next) => {
                  set('searchProvider', next as SearchProviderChoice)
                  if (next !== 'auto') setOpenId(next as ProviderId)
                },
              }),
              h(
                'p',
                { key: 'active', className: 'dshWebSearchActive' },
                status.active
                  ? `${props.t('activeNow')} · ${props.t(status.active)}`
                  : props.t('activeNone'),
              ),
            ],
          }),
          h(Field, {
            key: 'fetch',
            label: props.t('fetch'),
            hint: props.t('fetchHint'),
            children: [
              h(Tabs, {
                key: 'fetch-tabs',
                value: value.fetchProvider ?? 'auto',
                disabled,
                options: FETCH_OPTIONS.map((option) => ({ id: option.id, label: props.t(option.labelKey) })),
                onChange: (next) => set('fetchProvider', next as FetchProviderChoice),
              }),
              h(
                'p',
                { key: 'fetch-active', className: 'dshWebSearchActive' },
                status.activeFetch
                  ? `${props.t('activeNow')} · ${props.t(status.activeFetch)}`
                  : props.t('fetchHttp'),
              ),
            ],
          }),
          h(
            'div',
            { key: 'list', className: 'dshWebSearchList' },
            h(ProviderCard, {
              title: props.t('baidu'),
              description: props.t('baiduDesc'),
              badge: badgeOf('baidu'),
              kind: kindOf('baidu'),
              open: open === 'baidu',
              onToggle: () => toggle('baidu'),
              children: [
                h(Field, {
                  key: 'baidu-key',
                  label: props.t('baiduKey'),
                  hint: props.t('baiduKeyHint'),
                  children: h(SecretField, {
                    configured: configured('baidu'),
                    savedLabel: props.t('saved'),
                    placeholder: 'BAIDU_API_KEY',
                    disabled,
                    onSave: (next) => set('baiduApiKey', next),
                  }),
                }),
                h(Field, {
                  key: 'baidu-model',
                  label: props.t('baiduModel'),
                  hint: props.t('baiduModelHint'),
                  children: h(TextField, {
                    value: value.baiduModel,
                    disabled,
                    onChange: (next) => set('baiduModel', next),
                  }),
                }),
                h(
                  'details',
                  { key: 'baidu-endpoint', className: 'dshWebSearchDetails' },
                  h('summary', null, props.t('endpoint')),
                  h(TextField, {
                    value: value.baiduBaseURL,
                    disabled,
                    onChange: (next) => set('baiduBaseURL', next),
                  }),
                ),
                h(ProbeButton, {
                  key: 'baidu-probe',
                  id: 'baidu',
                  configured: configured('baidu'),
                  disabled,
                  t: props.t,
                }),
              ],
            }),
            h(ProviderCard, {
              title: props.t('doubao'),
              description: props.t('doubaoDesc'),
              badge: badgeOf('doubao'),
              kind: kindOf('doubao'),
              open: open === 'doubao',
              onToggle: () => toggle('doubao'),
              children: [
                h(Field, {
                  key: 'doubao-key',
                  label: props.t('doubaoKey'),
                  hint: props.t('doubaoKeyHint'),
                  children: h(SecretField, {
                    configured: configured('doubao'),
                    savedLabel: props.t('saved'),
                    placeholder: 'ARK_API_KEY',
                    disabled,
                    onSave: (next) => set('doubaoApiKey', next),
                  }),
                }),
                h(Field, {
                  key: 'doubao-model',
                  label: props.t('doubaoModel'),
                  hint: props.t('doubaoModelHint'),
                  children: h(TextField, {
                    value: value.doubaoModel,
                    disabled,
                    onChange: (next) => set('doubaoModel', next),
                  }),
                }),
                h(
                  'details',
                  { key: 'doubao-endpoint', className: 'dshWebSearchDetails' },
                  h('summary', null, props.t('endpoint')),
                  h(TextField, {
                    value: value.doubaoBaseURL,
                    disabled,
                    onChange: (next) => set('doubaoBaseURL', next),
                  }),
                ),
                h(ProbeButton, {
                  key: 'doubao-probe',
                  id: 'doubao',
                  configured: configured('doubao'),
                  disabled,
                  t: props.t,
                }),
              ],
            }),
            h(ProviderCard, {
              title: props.t('tavily'),
              description: props.t('tavilyDesc'),
              badge: badgeOf('tavily'),
              kind: kindOf('tavily'),
              open: open === 'tavily',
              onToggle: () => toggle('tavily'),
              children: [
                h(Field, {
                  key: 'tavily-key',
                  label: props.t('tavilyKey'),
                  hint: props.t('tavilyKeyHint'),
                  children: h(SecretField, {
                    configured: configured('tavily'),
                    savedLabel: props.t('saved'),
                    placeholder: 'TAVILY_API_KEY',
                    disabled,
                    onSave: (next) => set('tavilyApiKey', next),
                  }),
                }),
                h(Field, {
                  key: 'tavily-depth',
                  label: props.t('tavilyDepth'),
                  hint: props.t('tavilyDepthHint'),
                  children: h(SelectField, {
                    value: value.tavilySearchDepth,
                    disabled,
                    options: [
                      { id: 'basic', label: props.t('depthBasic') },
                      { id: 'advanced', label: props.t('depthAdvanced') },
                      { id: 'fast', label: props.t('depthFast') },
                      { id: 'ultra-fast', label: props.t('depthUltra') },
                    ],
                    onChange: (next) => set('tavilySearchDepth', next),
                  }),
                }),
                h(Field, {
                  key: 'tavily-extract',
                  label: props.t('tavilyExtract'),
                  hint: props.t('tavilyExtractHint'),
                  children: h(SelectField, {
                    value: value.tavilyExtractDepth ?? 'basic',
                    disabled,
                    options: [
                      { id: 'basic', label: props.t('depthBasic') },
                      { id: 'advanced', label: props.t('depthAdvanced') },
                    ],
                    onChange: (next) => set('tavilyExtractDepth', next),
                  }),
                }),
                h(
                  'details',
                  { key: 'tavily-endpoint', className: 'dshWebSearchDetails' },
                  h('summary', null, props.t('endpoint')),
                  h(TextField, {
                    value: value.tavilyBaseURL,
                    disabled,
                    onChange: (next) => set('tavilyBaseURL', next),
                  }),
                ),
                h(ProbeButton, {
                  key: 'tavily-probe',
                  id: 'tavily',
                  configured: configured('tavily'),
                  disabled,
                  t: props.t,
                }),
              ],
            }),
            h(ProviderCard, {
              title: props.t('exa'),
              description: props.t('exaDesc'),
              badge: badgeOf('exa'),
              kind: kindOf('exa'),
              open: open === 'exa',
              onToggle: () => toggle('exa'),
              children: [
                h(Field, {
                  key: 'exa-key',
                  label: props.t('exaKey'),
                  hint: props.t('exaKeyHint'),
                  children: h(SecretField, {
                    configured: configured('exa'),
                    savedLabel: props.t('saved'),
                    placeholder: 'EXA_API_KEY',
                    disabled,
                    onSave: (next) => set('exaApiKey', next),
                  }),
                }),
                h(Field, {
                  key: 'exa-type',
                  label: props.t('exaType'),
                  hint: props.t('exaTypeHint'),
                  children: h(SelectField, {
                    value: value.exaSearchType,
                    disabled,
                    options: [
                      { id: 'auto', label: props.t('typeAuto') },
                      { id: 'keyword', label: props.t('typeKeyword') },
                      { id: 'neural', label: props.t('typeNeural') },
                    ],
                    onChange: (next) => set('exaSearchType', next),
                  }),
                }),
                h(
                  'details',
                  { key: 'exa-endpoint', className: 'dshWebSearchDetails' },
                  h('summary', null, props.t('endpoint')),
                  h(TextField, {
                    value: value.exaBaseURL,
                    disabled,
                    onChange: (next) => set('exaBaseURL', next),
                  }),
                  h(Field, {
                    label: props.t('exaProviderId'),
                    hint: props.t('exaProviderIdHint'),
                    children: h(TextField, {
                      value: value.exaProviderId,
                      disabled,
                      onChange: (next) => set('exaProviderId', next),
                    }),
                  }),
                ),
                h(ProbeButton, {
                  key: 'exa-probe',
                  id: 'exa',
                  configured: configured('exa'),
                  disabled,
                  t: props.t,
                }),
              ],
            }),
          ),
          h('p', { key: 'secret-hint', className: 'dshWebSearchHint' }, props.t('secretHint')),
        ]
      : h('p', { className: 'dshWebSearchNote' }, props.t('builtinNote')),
  )
}
