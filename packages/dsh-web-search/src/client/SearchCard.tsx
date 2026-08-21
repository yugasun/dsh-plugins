import { createElement as h, useEffect, useRef, useState, type ReactNode } from 'react'
import type { ClientConfig, FetchProviderChoice, ProbeResult, ProviderId, SearchProviderChoice, SettingsScope } from './model.ts'
import { DOUBAO_DOCS, FETCH_OPTIONS, firstOpenProvider, PROVIDER_KEY_URLS, PROVIDER_OPTIONS, VENDOR_ORDER } from './model.ts'
import { EngineTabs } from './EngineTabs.tsx'
import { secretCommit, secretDisplay } from './secret-field.ts'
import { useSearchStatus } from './useSearchStatus.ts'
import { useSettingsScope } from './useSettingsScope.ts'

type ProbeState = ProbeResult | 'need-key' | null

interface SearchCardProps {
  t: (key: string) => string
  scope: SettingsScope<ClientConfig>
}

function Field(props: {
  label: string
  hint?: string
  htmlFor?: string
  action?: ReactNode
  children?: ReactNode
}) {
  return h(
    'div',
    { className: 'dshWebSearchField' },
    h(
      'div',
      { className: 'dshWebSearchField-head' },
      h(props.htmlFor ? 'label' : 'div', {
        className: 'dshWebSearchField-label',
        htmlFor: props.htmlFor,
      }, props.label),
      props.action ?? null,
    ),
    props.hint ? h('p', { className: 'dshWebSearchField-hint' }, props.hint) : null,
    props.children,
  )
}

function ExternalIcon() {
  return h(
    'svg',
    {
      className: 'dshWebSearchExt-icon',
      width: 12,
      height: 12,
      viewBox: '0 0 16 16',
      fill: 'none',
      'aria-hidden': true,
      focusable: false,
    },
    h('path', {
      d: 'M6.5 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8A1.5 1.5 0 0 0 13 12.5V9.5M9 2h5v5M8 8l6-6',
      stroke: 'currentColor',
      strokeWidth: 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
  )
}

function ExtLink(props: {
  href: string
  label: string
  children: ReactNode
  className?: string
}) {
  return h(
    'a',
    {
      className: `dshWebSearchExt${props.className ? ` ${props.className}` : ''}`,
      href: props.href,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': props.label,
    },
    props.children,
    h(ExternalIcon),
  )
}

function KeyField(props: {
  id: string
  vendor: ProviderId
  label: string
  hint: string
  placeholder: string
  configured: boolean
  disabled: boolean
  t: (key: string) => string
  onSave: (value: string) => void
}) {
  const getKey = props.t('getApiKey')
  return h(Field, {
    htmlFor: props.id,
    label: props.label,
    hint: props.hint,
    action: h(ExtLink, {
      href: PROVIDER_KEY_URLS[props.vendor],
      label: `${getKey} (${props.t(props.vendor)}) · ${props.t('opensNewTab')}`,
      children: getKey,
    }),
        children: h(SecretField, {
      id: props.id,
      configured: props.configured,
      savedLabel: props.t('saved'),
      clearLabel: props.t('clearKey'),
      placeholder: props.placeholder,
      disabled: props.disabled,
      onSave: props.onSave,
    }),
  })
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
  id?: string
  configured: boolean
  savedLabel: string
  clearLabel: string
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
    else if (commit.kind === 'clear') props.onSave('')
  }
  const clear = () => {
    draftRef.current = null
    setDraft(null)
    props.onSave('')
  }
  return h(
    'div',
    { className: 'dshWebSearchSecret' },
    h('input', {
      id: props.id,
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
    props.configured && !props.disabled
      ? h('button', {
        type: 'button',
        className: 'dshWebSearchSecret-clear',
        onMouseDown: (event: { preventDefault(): void }) => {
          event.preventDefault()
        },
        onClick: clear,
      }, props.clearLabel)
      : null,
  )
}

function TextField(props: {
  id?: string
  value?: string
  placeholder?: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return h('input', {
    id: props.id,
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
  id?: string
  value: string
  disabled: boolean
  options: Array<{ id: string; label: string }>
  onChange: (value: string) => void
}) {
  return h(
    'select',
    {
      id: props.id,
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
  result: ProbeState
  onResult: (result: ProbeState) => void
  onDone: () => void
}) {
  const [busy, setBusy] = useState(false)
  const acRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => acRef.current?.abort()
  }, [props.id])

  const run = () => {
    if (!props.configured) {
      props.onResult('need-key')
      return
    }
    acRef.current?.abort()
    const ac = new AbortController()
    acRef.current = ac
    setBusy(true)
    props.onResult(null)
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
        props.onResult(body)
        if (body.ok) props.onDone()
      })
      .catch((error: unknown) => {
        if (ac.signal.aborted) return
        props.onResult({
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
  const result = props.result
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
        className: `dshWebSearchProbe-btn${props.configured ? ' is-primary' : ''}`,
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
  const [selectedTab, setSelectedTab] = useState<ProviderId | 'init'>('init')
  const [probeByVendor, setProbeByVendor] = useState<Partial<Record<ProviderId, ProbeState>>>({})
  const panelRef = useRef<HTMLDivElement>(null)

  if (!value) {
    return h('p', { className: 'dshWebSearchStatus-empty' }, props.t('loading'))
  }

  const disabled = !snap.writable
  const custom = value.customSearch !== false
  const t = props.t
  const fetchChoice: FetchProviderChoice = value.fetchProvider ?? 'auto'
  const configured = (id: ProviderId) =>
    status.providers.find((provider) => provider.id === id)?.configured === true
  const anyConfigured = VENDOR_ORDER.some((id) => configured(id))
  const set = (field: string, next: unknown) => {
    void props.scope.set(field, next).then(() => refresh())
  }
  const saveSecret = (field: string, next: string) => {
    const write = next.length === 0 && typeof props.scope.unset === 'function'
      ? props.scope.unset(field)
      : props.scope.set(field, next)
    void write.then(() => refresh())
  }
  const initialTab: ProviderId = firstOpenProvider(
    value.searchProvider,
    status.active,
    configured,
  )
  const selected: ProviderId = selectedTab === 'init' ? initialTab : selectedTab
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
  const setProbeResult = (id: ProviderId, result: ProbeState) => {
    setProbeByVendor((prev) => ({ ...prev, [id]: result }))
  }

  const vendorPanel = (id: ProviderId): ReactNode => {
    const probeProps = {
      configured: configured(id),
      disabled,
      t,
      result: probeByVendor[id] ?? null,
      onResult: (result: ProbeState) => setProbeResult(id, result),
      onDone: refresh,
    }
    if (id === 'baidu') {
      return [
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
          ? h('p', { key: 'baidu-note', className: 'dshWebSearchPanel-note' }, t('baiduNote'))
          : null,
        h(KeyField, {
          key: 'baidu-key',
          id: 'dsh-web-search-baidu-key',
          vendor: 'baidu',
          label: t('baiduKey'),
          hint: t('baiduKeyHint'),
          placeholder: 'BAIDU_API_KEY',
          configured: configured('baidu'),
          disabled,
          t,
          onSave: (next) => saveSecret('baiduApiKey', next),
        }),
        value.baiduSearchMode === 'ai'
          ? h(Field, {
            key: 'baidu-model',
            htmlFor: 'dsh-web-search-baidu-model',
            label: t('baiduModel'),
            hint: t('baiduModelHint'),
            children: h(TextField, {
              id: 'dsh-web-search-baidu-model',
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
        h(ProbeButton, { key: 'baidu-probe', id: 'baidu', ...probeProps }),
      ]
    }
    if (id === 'doubao') {
      return [
        h(Field, {
          key: 'doubao-mode',
          label: t('doubaoMode'),
          hint: t('doubaoModeHint'),
          action: h(ExtLink, {
            href: DOUBAO_DOCS[value.doubaoSearchMode === 'global' ? 'global' : 'custom'],
            label: `${t('doubaoDocs')} · ${t('opensNewTab')}`,
            children: t('doubaoDocs'),
          }),
          children: h(Seg, {
            value: value.doubaoSearchMode === 'global' ? 'global' : 'custom',
            disabled,
            label: t('doubaoMode'),
            options: [
              { id: 'custom', label: t('doubaoModeCustom') },
              { id: 'global', label: t('doubaoModeGlobal') },
            ],
            onChange: (next) => set('doubaoSearchMode', next),
          }),
        }),
        h(KeyField, {
          key: 'doubao-key',
          id: 'dsh-web-search-doubao-key',
          vendor: 'doubao',
          label: t('doubaoKey'),
          hint: t('doubaoKeyHint'),
          placeholder: 'DOUBAO_API_KEY',
          configured: configured('doubao'),
          disabled,
          t,
          onSave: (next) => saveSecret('doubaoApiKey', next),
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
        h(ProbeButton, { key: 'doubao-probe', id: 'doubao', ...probeProps }),
      ]
    }
    if (id === 'tavily') {
      return [
        h(KeyField, {
          key: 'tavily-key',
          id: 'dsh-web-search-tavily-key',
          vendor: 'tavily',
          label: t('tavilyKey'),
          hint: t('tavilyKeyHint'),
          placeholder: 'TAVILY_API_KEY',
          configured: configured('tavily'),
          disabled,
          t,
          onSave: (next) => saveSecret('tavilyApiKey', next),
        }),
        h(Field, {
          key: 'tavily-depth',
          htmlFor: 'dsh-web-search-tavily-depth',
          label: t('tavilyDepth'),
          hint: t('tavilyDepthHint'),
          children: h(SelectField, {
            id: 'dsh-web-search-tavily-depth',
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
          htmlFor: 'dsh-web-search-tavily-extract',
          label: t('tavilyExtract'),
          hint: t('tavilyExtractHint'),
          children: h(SelectField, {
            id: 'dsh-web-search-tavily-extract',
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
        h(ProbeButton, { key: 'tavily-probe', id: 'tavily', ...probeProps }),
      ]
    }
    if (id === 'serper') {
      return [
        h('p', { key: 'serper-note', className: 'dshWebSearchPanel-note' }, t('serperNote')),
        h(KeyField, {
          key: 'serper-key',
          id: 'dsh-web-search-serper-key',
          vendor: 'serper',
          label: t('serperKey'),
          hint: t('serperKeyHint'),
          placeholder: 'SERPER_API_KEY',
          configured: configured('serper'),
          disabled,
          t,
          onSave: (next) => saveSecret('serperApiKey', next),
        }),
        h(
          'details',
          { key: 'serper-endpoint', className: 'dshWebSearchDetails' },
          h('summary', null, t('endpoint')),
          h(TextField, {
            value: value.serperBaseURL,
            disabled,
            onChange: (next) => set('serperBaseURL', next),
          }),
          h(Field, {
            htmlFor: 'dsh-web-search-serper-gl',
            label: t('serperGl'),
            hint: t('serperGlHint'),
            children: h(TextField, {
              id: 'dsh-web-search-serper-gl',
              value: value.serperGl,
              disabled,
              onChange: (next) => set('serperGl', next),
            }),
          }),
          h(Field, {
            htmlFor: 'dsh-web-search-serper-hl',
            label: t('serperHl'),
            hint: t('serperHlHint'),
            children: h(TextField, {
              id: 'dsh-web-search-serper-hl',
              value: value.serperHl,
              disabled,
              onChange: (next) => set('serperHl', next),
            }),
          }),
        ),
        h(ProbeButton, { key: 'serper-probe', id: 'serper', ...probeProps }),
      ]
    }
    return [
      h('p', { key: 'exa-note', className: 'dshWebSearchPanel-note' }, t('exaNote')),
      h(KeyField, {
        key: 'exa-key',
        id: 'dsh-web-search-exa-key',
        vendor: 'exa',
        label: t('exaKey'),
        hint: t('exaKeyHint'),
        placeholder: 'EXA_API_KEY',
        configured: configured('exa'),
        disabled,
        t,
        onSave: (next) => saveSecret('exaApiKey', next),
      }),
      h(Field, {
        key: 'exa-type',
        htmlFor: 'dsh-web-search-exa-type',
        label: t('exaType'),
        hint: t('exaTypeHint'),
        children: h(SelectField, {
          id: 'dsh-web-search-exa-type',
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
          htmlFor: 'dsh-web-search-exa-provider',
          label: t('exaProviderId'),
          hint: t('exaProviderIdHint'),
          children: h(TextField, {
            id: 'dsh-web-search-exa-provider',
            value: value.exaProviderId,
            disabled,
            onChange: (next) => set('exaProviderId', next),
          }),
        }),
      ),
      h(ProbeButton, { key: 'exa-probe', id: 'exa', ...probeProps }),
    ]
  }

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
    custom && !anyConfigured
      ? h('p', { key: 'keys-hint', className: 'dshWebSearchField-hint dshWebSearchKeys-hint' }, t('keysHint'))
      : null,
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
                if (next !== 'auto') setSelectedTab(next as ProviderId)
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
          h(
            EngineTabs,
            {
              key: 'tabs',
              selected,
              disabled,
              t,
              badgeOf,
              kindOf,
              panelRef,
              onSelect: (id) => setSelectedTab(id),
              children: vendorPanel(selected),
            },
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
