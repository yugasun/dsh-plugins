# Web search settings: engine tabs

Date: 2026-08-20  
Package: `packages/dsh-web-search`  
Status: approved in conversation; waiting for spec review before implementation plan

## Problem

The Web search settings page is a vertical stack: summary, custom-search switch, search/fetch segmented controls, then four accordion vendor cards. Baidu and Doubao each gained type switches, key links, and probe. First-time setup (pick one engine, get a key, paste, test) is the main job, but the page already requires scrolling. More engines later would make stacked cards worse.

## Goals

- First visit: configure **one** engine without feeling all vendors must be filled.
- After the first key is saved or a probe succeeds: show the **full** settings (search backend, page extract, all engines) without changing to a second layout.
- Replace stacked vendor cards with **tabs** so only one engine form is visible.
- Adding a fifth+ engine must not grow page height via wrapped tabs.

## Non-goals

- New search backends in this change.
- A multi-step wizard.
- Hiding unused engines on first run (tabs always list every registered engine).
- Changing search/fetch routing logic, probe HTTP, or vendor APIs.

## Page structure

Top to bottom, always the same three regions when custom search is on:

1. **Summary** — current `web_search` / `web_fetch` labels, custom-search switch. If no vendor is configured, keep a one-line hint that **one** engine is enough. Hide that hint once any vendor is configured.
2. **Routing** — search backend segmented control (`auto` + each vendor) and page-extract segmented control. Unchanged behavior.
3. **Engine tabs + one panel** — tablist of vendors; only the selected vendor’s form is mounted.

When custom search is off, keep today’s builtin note; do not show tabs.

The setup “three steps” callout is replaced by the one-line hint in the summary. Do not keep both.

## Tabs

- One tab per registered vendor, in existing order: Baidu, Doubao, Tavily, Exa.
- Tabs **do not wrap** and **never reorder**; they always follow the vendor registry.
- **More** (add locale key `more`: 更多 / More) is a `button` pinned at the trailing edge, not a tab. Hide More when every engine tab already fits.
- Measure how many tabs fit beside More (`N`). The visible window is a contiguous slice of the registry of length `N` that **always contains the selected vendor**. Engines outside that window appear only in the More menu (same text badges). Choosing a menu item selects that engine, slides the window so the selection is visible, closes the menu, and focuses the panel.
- If `N < 1` (very narrow): show a horizontally scrollable tab strip with an edge fade and keep More pinned. No stacked layout under about `520px`.

### Tab badges

Each visible tab and each More-menu row shows one **text** badge from existing locale keys (`active` / `ready` / `missing`). Do not rely on color alone.

| Condition | Locale key | zh / en |
| --- | --- | --- |
| Custom search on and this vendor is `status.active` | `active` | 生效中 / Active |
| `status.providers[].configured` and not active | `ready` | 已配置 / Configured |
| Not configured | `missing` | 未配置 / Missing |

Reuse today’s `kindOf` mapping (`on` / `ready` / `off`). `configured` already includes endpoint readiness (Baidu AI without a model stays Missing). An explicit `searchProvider` with no key stays Missing; the tab is still selected.

### Selected tab (UI state)

Selected tab is **not** persisted as `searchProvider`. Initialize once when the card first has config + status:

- If `searchProvider` is an explicit vendor, select that tab.
- If `searchProvider` is `auto`: select `status.active` when set, otherwise the first unconfigured vendor in registry order (today: Baidu).

This replaces accordion `firstOpenProvider` / `open`.

After init:

| User action | Effect |
| --- | --- |
| Change search-backend Seg to a vendor | Select that vendor’s tab. |
| Change search-backend Seg to Auto | Keep the current tab. |
| Click an engine tab or a More-menu engine | Show that panel only. **Do not** write `searchProvider`. |
| Probe success, key save, or `status.active` change | Keep the current tab. Hide the one-engine hint when any vendor becomes configured. |
| Click Get API key / edit fields / probe | Only that vendor’s settings. |

Rationale: configuring Tavily must not silently pin production `web_search` to Tavily. Filling the first key must not yank the user off the tab they are editing.

## Panel contents

Same fields as today’s card body, in this order:

1. Vendor type switches that already exist (Baidu ordinary/AI, Doubao Custom/Global). Omit the row if the vendor has none.
2. Other in-panel vendor options that are not endpoints (Baidu model when AI is selected, Tavily search/extract depth, Exa retrieval type). Same visibility rules as today.
3. API key + Get API key (console URL unchanged). Unconfigured panels still include Get API key here; tab chrome does not duplicate the old collapsed-card head link.
4. Test connection (primary when a key is saved; keep shipped high-contrast busy/disabled label color).
5. Base URL / endpoint only, in a collapsed `<details>`. Do not move model, depth, or retrieval type into details.

Probe success/failure stays beside the button (`role="status"`), not at page top. Store the last probe message **per vendor id** on the card so switching tabs and back does not clear it. Probe never changes the selected tab.

## Data and extensibility

Vendors stay a single ordered registry (today: `VENDOR_ORDER` / `PROVIDER_OPTIONS` / `PROVIDER_IDS`). A new engine is: registry entry + panel fields + backend provider. Settings UI must iterate the registry to render tabs; it must not hard-code four stacked `vendorCard(...)` trees as the only way to add a vendor.

Overflow/More is driven by layout (what fits) plus a stable registry order. Tests may simulate overflow by a narrow container or a stubbed vendor list longer than four; they do not need a real extra backend.

## Accessibility

- Tab strip: `role="tablist"`; each **visible** engine control is `role="tab"` with `aria-selected`; the panel is `role="tabpanel"` labelled by the selected tab. Overflowed engines are omitted from the tablist until the window slides to include them.
- Arrow Left/Right moves among **visible** tabs (not into More). More is reached by Tab. Roving tabindex stays on the selected engine tab.
- More menu: no focus trap required for a short list; Esc closes and returns focus to More. Choosing an engine slides the window, then focuses the panel.
- Get API key links keep `target="_blank"`, `rel="noopener noreferrer"`, and an accessible name that includes the existing `opensNewTab` copy.
- Respect `prefers-reduced-motion` for tab indicator and More open/close.

## Errors

- Missing key on probe: existing in-panel “add a key first” message.
- Probe HTTP failure: existing in-panel error string; do not switch tabs.
- Invalid settings (e.g. Baidu AI with empty model): existing `providerEndpointReady` / `configured` rules; badge stays Missing; no extra modal.

## Testing

Keep existing Baidu/Doubao request tests.

Add/adjust client-facing unit tests (no browser required):

- Default tab is first unconfigured vendor when auto and none configured.
- Explicit `searchProvider` selects that tab.
- Selecting a tab does not call `scope.set('searchProvider', ...)`.
- Overflow helper: given registry order, selected id, and `N`, return a contiguous visible window that contains the selection, plus the overflow list for More. Selecting an overflow id updates the window so that id is visible. Tabs never change order.
- Changing `searchProvider` to Auto does not change the already selected tab.

## Out of scope for copy/docs unless implementation touches them

README screenshots can lag. Do not block the feature on a new `docs/settings.png` unless the implementer already regenerates screenshots.
