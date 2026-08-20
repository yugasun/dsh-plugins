import { createElement as h, useEffect, useRef, useState, type ReactNode } from 'react'
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

function Switch(props: {
  checked: boolean
  disabled: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return h(
    'label',
    { className: `dshWebSearchSwitch${props.checked ? ' is-on' : ''}${props.disabled ? ' is-off' : ''}` },
    h('input', {
      type: 'checkbox',
      role: 'switch',
      checked: props.checked,
      disabled: props.disabled,
      'aria-label': props.label,
      onChange: (event: { currentTarget: { checked: boolean } }) => {
        props.onChange(event.currentTarget.checked)
      },
    }),
    h('span', { className: 'dshWebSearchSwitch-track', 'aria-hidden': true },
      h('span', { className: 'dshWebSearchSwitch-thumb' }),
    ),
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
  const commitDraft = () => {
    const current = draftRef.current
    if (current === null) return
    const commit = secretCommit(current)
    draftRef.current = null
    setDraft(null)
    if (commit.kind === 'set') props.onSave(commit.value)
  }
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
      onKeyDown: (event: { key: string; currentTarget: { blur(): void } }) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      },
      onBlur: commitDraft,
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

function Seg(props: {
  value: string
  disabled: boolean
  label: string
  options: Array<{ id: string; label: string }>
  onChange: (value: string) => void
}) {
  const move = (delta: number) => {
    const index = props.options.findIndex((option) => option.id === props.value)
    const next = props.options[(index + delta + props.options.length) % props.options.length]
    if (next && next.id !== props.value) props.onChange(next.id)
  }
  return h(
    'div',
    {
      className: 'dshWebSearchSeg',
      role: 'tablist',
      'aria-label': props.label,
      onKeyDown: (event: { key: string; preventDefault(): void }) => {
        if (props.disabled) return
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault()
          move(1)
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault()
          move(-1)
        }
      },
    },
    ...props.options.map((option) =>
      h(
        'button',
        {
          type: 'button',
          key: option.id,
          role: 'tab',
          'aria-selected': props.value === option.id,
          className: `dshWebSearchSeg-item${props.value === option.id ? ' is-on' : ''}`,
          disabled: props.disabled,
          tabIndex: props.value === option.id ? 0 : -1,
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
  onDone: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ProbeResult | 'need-key' | null>(null)
  const acRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => acRef.current?.abort()
  }, [props.id])

  const run = () => {
    if (!props.configured) {
      setResult('need-key')
      return
    }
    acRef.current?.abort()
    const ac = new AbortController()
    acRef.current = ac
    setBusy(true)
    setResult(null)
    void fetch('/dsh-web-search/probe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: props.id }),
      signal: ac.signal,
    })
      .then(async (response) => {
        if (ac.signal.aborted) return
        let body: ProbeResult | null = null
        try {
          body = await response.json() as ProbeResult
        } catch {
          body = { ok: false, provider: props.id, error: `HTTP ${response.status}` }
        }
        if (ac.signal.aborted) return
        setResult(body)
        if (body.ok) props.onDone()
      })
      .catch((error: unknown) => {
        if (ac.signal.aborted) return
        setResult({
          ok: false,
          provider: props.id,
          error: error instanceof Error ? error.message : String(error),
        })
      })
      .finally(() => {
        if (!ac.signal.aborted) setBusy(false)
      })
  }

  let message: string | null = null
  let tone = ''
  if (result === 'need-key') {
    message = props.t('testNeedKey')
    tone = 'is-bad'
  } else if (result != null) {
    if (result.ok) {
      message = `${props.t('testOk')}${typeof result.sources === 'number' ? ` · ${result.sources} ${props.t('testSources')}` : ''}`
      tone = 'is-ok'
    } else {
      message = `${props.t('testFail')}${result.error ? ` · ${result.error}` : ''}`
      tone = 'is-bad'
    }
  }

  return h(
    'div',
    { className: 'dshWebSearchProbe' },
    h(
      'button',
      {
        type: 'button',
        className: 'dshWebSearchProbe-btn',
        disabled: props.disabled || busy,
        'aria-busy': busy,
        onClick: run,
      },
      busy ? props.t('testing') : props.t('testConnection'),
    ),
    message
      ? h('p', { className: `dshWebSearchProbe-msg ${tone}`, role: 'status' }, message)
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

function searchSummary(
  t: (key: string) => string,
  custom: boolean,
  choice: SearchProviderChoice,
  active: ProviderId | null,
): string {
  if (!custom) return t('customOff')
  if (active == null) return t('activeNone')
  if (choice === 'auto') return `${t('auto')} · ${t(active)}`
  return t(active)
}

function fetchSummary(
  t: (key: string) => string,
  custom: boolean,
  choice: FetchProviderChoice,
  activeFetch: 'tavily' | 'exa' | null,
): string {
  if (!custom || choice === 'http') return t('fetchHttp')
  if (choice === 'tavily' || choice === 'exa') return t(choice)
  if (activeFetch) return `${t('fetchAuto')} · ${t(activeFetch)}`
  return `${t('fetchAuto')} · ${t('fetchHttp')}`
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
  const fetchChoice: FetchProviderChoice = value.fetchProvider ?? 'auto'
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
  const t = props.t

  return h(
    'div',
    { className: 'dshWebSearchForm' },
    h(
      'div',
      { className: 'dshWebSearchSummary' },
      h(
        'div',
        { className: 'dshWebSearchSummary-item' },
        h('span', { className: 'dshWebSearchSummary-k' }, t('summarySearch')),
        h('span', { className: 'dshWebSearchSummary-v' }, searchSummary(t, custom, value.searchProvider, status.active)),
      ),
      h(
        'div',
        { className: 'dshWebSearchSummary-item' },
        h('span', { className: 'dshWebSearchSummary-k' }, t('summaryFetch')),
        h('span', { className: 'dshWebSearchSummary-v' }, fetchSummary(t, custom, fetchChoice, status.activeFetch)),
      ),
      h(
        'div',
        { className: 'dshWebSearchSummary-end' },
        h('span', { className: 'dshWebSearchSummary-k' }, t('customSearch')),
        h(Switch, {
          checked: custom,
          disabled,
          label: t('customSearch'),
          onChange: (checked) => set('customSearch', checked),
        }),
      ),
    ),
    h('p', { className: 'dshWebSearchField-hint dshWebSearchSummary-hint' }, t('customSearchHint')),
    custom
      ? [
          h(Field, {
            key: 'provider',
            label: t('provider'),
            hint: t('providerHint'),
            children: h(Seg, {
              value: value.searchProvider,
              disabled,
              label: t('provider'),
              options: PROVIDER_OPTIONS.map((option) => ({ id: option.id, label: t(option.labelKey) })),
              onChange: (next) => {
                set('searchProvider', next as SearchProviderChoice)
                if (next !== 'auto') setOpenId(next as ProviderId)
              },
            }),
          }),
          h(Field, {
            key: 'fetch',
            label: t('fetch'),
            hint: t('fetchHint'),
            children: h(Seg, {
              value: fetchChoice,
              disabled,
              label: t('fetch'),
              options: FETCH_OPTIONS.map((option) => ({ id: option.id, label: t(option.labelKey) })),
              onChange: (next) => set('fetchProvider', next as FetchProviderChoice),
            }),
          }),
          h('div', { key: 'keys-label', className: 'dshWebSearchKeys' }, t('keysHeading')),
          h(
            'div',
            { key: 'list', className: 'dshWebSearchList' },
            h(ProviderCard, {
              title: t('baidu'),
              description: t('baiduDesc'),
              badge: badgeOf('baidu'),
              kind: kindOf('baidu'),
              open: open === 'baidu',
              onToggle: () => toggle('baidu'),
              children: [
                h(Field, {
                  key: 'baidu-mode',
                  label: t('baiduMode'),
                  hint: t('baiduModeHint'),
                  children: h(Seg, {
                    value: value.baiduSearchMode === 'ai' ? 'ai' : 'web',
                    disabled,
                    label: t('baiduMode'),
                    options: [
                      { id: 'web', label: t('baiduModeWeb') },
                      { id: 'ai', label: t('baiduModeAi') },
                    ],
                    onChange: (next) => set('baiduSearchMode', next),
                  }),
                }),
                value.baiduSearchMode === 'ai'
                  ? h('p', { key: 'baidu-note', className: 'dshWebSearchCard-note' }, t('baiduNote'))
                  : null,
                h(Field, {
                  key: 'baidu-key',
                  label: t('baiduKey'),
                  hint: t('baiduKeyHint'),
                  children: h(SecretField, {
                    configured: configured('baidu'),
                    savedLabel: t('saved'),
                    placeholder: 'BAIDU_API_KEY',
                    disabled,
                    onSave: (next) => set('baiduApiKey', next),
                  }),
                }),
                value.baiduSearchMode === 'ai'
                  ? h(Field, {
                    key: 'baidu-model',
                    label: t('baiduModel'),
                    hint: t('baiduModelHint'),
                    children: h(TextField, {
                      value: value.baiduModel,
                      disabled,
                      onChange: (next) => set('baiduModel', next),
                    }),
                  })
                  : null,
                h(
                  'details',
                  { key: 'baidu-endpoint', className: 'dshWebSearchDetails' },
                  h('summary', null, t('endpoint')),
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
                  t,
                  onDone: refresh,
                }),
              ],
            }),
            h(ProviderCard, {
              title: t('doubao'),
              description: t('doubaoDesc'),
              badge: badgeOf('doubao'),
              kind: kindOf('doubao'),
              open: open === 'doubao',
              onToggle: () => toggle('doubao'),
              children: [
                h(Field, {
                  key: 'doubao-key',
                  label: t('doubaoKey'),
                  hint: t('doubaoKeyHint'),
                  children: h(SecretField, {
                    configured: configured('doubao'),
                    savedLabel: t('saved'),
                    placeholder: 'ARK_API_KEY',
                    disabled,
                    onSave: (next) => set('doubaoApiKey', next),
                  }),
                }),
                h(Field, {
                  key: 'doubao-model',
                  label: t('doubaoModel'),
                  hint: t('doubaoModelHint'),
                  children: h(TextField, {
                    value: value.doubaoModel,
                    disabled,
                    onChange: (next) => set('doubaoModel', next),
                  }),
                }),
                h(
                  'details',
                  { key: 'doubao-endpoint', className: 'dshWebSearchDetails' },
                  h('summary', null, t('endpoint')),
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
                  t,
                  onDone: refresh,
                }),
              ],
            }),
            h(ProviderCard, {
              title: t('tavily'),
              description: t('tavilyDesc'),
              badge: badgeOf('tavily'),
              kind: kindOf('tavily'),
              open: open === 'tavily',
              onToggle: () => toggle('tavily'),
              children: [
                h(Field, {
                  key: 'tavily-key',
                  label: t('tavilyKey'),
                  hint: t('tavilyKeyHint'),
                  children: h(SecretField, {
                    configured: configured('tavily'),
                    savedLabel: t('saved'),
                    placeholder: 'TAVILY_API_KEY',
                    disabled,
                    onSave: (next) => set('tavilyApiKey', next),
                  }),
                }),
                h(Field, {
                  key: 'tavily-depth',
                  label: t('tavilyDepth'),
                  hint: t('tavilyDepthHint'),
                  children: h(SelectField, {
                    value: value.tavilySearchDepth,
                    disabled,
                    options: [
                      { id: 'basic', label: t('depthBasic') },
                      { id: 'advanced', label: t('depthAdvanced') },
                      { id: 'fast', label: t('depthFast') },
                      { id: 'ultra-fast', label: t('depthUltra') },
                    ],
                    onChange: (next) => set('tavilySearchDepth', next),
                  }),
                }),
                h(Field, {
                  key: 'tavily-extract',
                  label: t('tavilyExtract'),
                  hint: t('tavilyExtractHint'),
                  children: h(SelectField, {
                    value: value.tavilyExtractDepth ?? 'basic',
                    disabled,
                    options: [
                      { id: 'basic', label: t('depthBasic') },
                      { id: 'advanced', label: t('depthAdvanced') },
                    ],
                    onChange: (next) => set('tavilyExtractDepth', next),
                  }),
                }),
                h(
                  'details',
                  { key: 'tavily-endpoint', className: 'dshWebSearchDetails' },
                  h('summary', null, t('endpoint')),
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
                  t,
                  onDone: refresh,
                }),
              ],
            }),
            h(ProviderCard, {
              title: t('exa'),
              description: t('exaDesc'),
              badge: badgeOf('exa'),
              kind: kindOf('exa'),
              open: open === 'exa',
              onToggle: () => toggle('exa'),
              children: [
                h('p', { key: 'exa-note', className: 'dshWebSearchCard-note' }, t('exaNote')),
                h(Field, {
                  key: 'exa-key',
                  label: t('exaKey'),
                  hint: t('exaKeyHint'),
                  children: h(SecretField, {
                    configured: configured('exa'),
                    savedLabel: t('saved'),
                    placeholder: 'EXA_API_KEY',
                    disabled,
                    onSave: (next) => set('exaApiKey', next),
                  }),
                }),
                h(Field, {
                  key: 'exa-type',
                  label: t('exaType'),
                  hint: t('exaTypeHint'),
                  children: h(SelectField, {
                    value: value.exaSearchType,
                    disabled,
                    options: [
                      { id: 'auto', label: t('typeAuto') },
                      { id: 'keyword', label: t('typeKeyword') },
                      { id: 'neural', label: t('typeNeural') },
                    ],
                    onChange: (next) => set('exaSearchType', next),
                  }),
                }),
                h(
                  'details',
                  { key: 'exa-endpoint', className: 'dshWebSearchDetails' },
                  h('summary', null, t('endpoint')),
                  h(TextField, {
                    value: value.exaBaseURL,
                    disabled,
                    onChange: (next) => set('exaBaseURL', next),
                  }),
                  h(Field, {
                    label: t('exaProviderId'),
                    hint: t('exaProviderIdHint'),
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
                  t,
                  onDone: refresh,
                }),
              ],
            }),
          ),
          h(
            'details',
            { key: 'secret-hint', className: 'dshWebSearchMore' },
            h('summary', null, t('secretMore')),
            h('p', { className: 'dshWebSearchHint' }, t('secretHint')),
          ),
        ]
      : h('p', { className: 'dshWebSearchNote' }, t('builtinNote')),
  )
}
