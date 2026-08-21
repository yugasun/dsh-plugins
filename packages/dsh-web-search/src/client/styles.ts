const TAG_ID = 'dsh-web-search/web-ui.v6.css'

const CSS = `
.dshWebSearchPage {
  max-width: 760px;
  color: var(--dsw-alias-label-primary);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dshWebSearchPage-heading {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}
.dshWebSearchPage-intro {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-tertiary));
}
.dshWebSearchForm {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
}
.dshWebSearchSummary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  padding: 12px 14px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-3, transparent);
}
.dshWebSearchSummary-item,
.dshWebSearchSummary-end {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.dshWebSearchSummary-item {
  flex: 1 1 9em;
}
.dshWebSearchSummary-end {
  margin-left: auto;
  align-items: flex-end;
  flex: none;
}
.dshWebSearchSummary-k {
  font-size: 11px;
  line-height: 1.4;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchSummary-v {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--dsw-alias-label-primary);
}
.dshWebSearchSummary-hint {
  padding: 8px 0 4px;
}
.dshWebSearchSwitch {
  position: relative;
  width: 44px;
  height: 28px;
  display: inline-flex;
  cursor: pointer;
  touch-action: manipulation;
}
.dshWebSearchSwitch.is-off {
  cursor: default;
}
.dshWebSearchSwitch input {
  appearance: none;
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: inherit;
  z-index: 1;
}
.dshWebSearchSwitch-track {
  width: 44px;
  height: 28px;
  border-radius: 999px;
  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, currentColor 12%, transparent));
  border: 1px solid var(--dsw-alias-border-l3, color-mix(in srgb, currentColor 18%, transparent));
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 3px;
  transition: background .16s ease, border-color .16s ease;
}
.dshWebSearchSwitch.is-on .dshWebSearchSwitch-track {
  background: var(--dsw-static-blue-450, #4d7cff);
  border-color: transparent;
}
.dshWebSearchSwitch-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px color-mix(in srgb, #000 20%, transparent);
  transform: translateX(0);
  transition: transform .16s ease;
}
.dshWebSearchSwitch.is-on .dshWebSearchSwitch-thumb {
  transform: translateX(16px);
}
.dshWebSearchSwitch input:focus-visible + .dshWebSearchSwitch-track {
  outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-static-blue-450));
  outline-offset: 2px;
}
.dshWebSearchField {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
}
.dshWebSearchField-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
}
.dshWebSearchField + .dshWebSearchField,
.dshWebSearchField + .dshWebSearchNote,
.dshWebSearchField + .dshWebSearchTabs,
.dshWebSearchNote + .dshWebSearchHint,
.dshWebSearchTabs + .dshWebSearchMore {
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.dshWebSearchField-label {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary);
}
.dshWebSearchField-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchField-input {
  font: inherit;
  width: 100%;
  max-width: 28em;
  box-sizing: border-box;
  padding: 10px 12px;
  min-height: 40px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l3, color-mix(in srgb, currentColor 18%, transparent));
  background: transparent;
  color: inherit;
}
.dshWebSearchField-input:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-static-blue-450));
  outline-offset: 1px;
}
.dshWebSearchSeg {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dshWebSearchSeg-item {
  appearance: none;
  margin: 0;
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, currentColor 8%, transparent));
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 14px;
  min-height: 36px;
  font-size: 13px;
  line-height: 20px;
  transition: color .16s ease, background .16s ease, border-color .16s ease;
}
.dshWebSearchSeg-item:hover {
  color: var(--dsw-alias-label-primary);
}
.dshWebSearchSeg-item.is-on {
  color: var(--dsw-static-blue-450, currentColor);
  background: color-mix(in srgb, var(--dsw-static-blue-450, currentColor) 14%, transparent);
  border-color: color-mix(in srgb, var(--dsw-static-blue-450, currentColor) 35%, transparent);
  font-weight: 600;
}
.dshWebSearchSeg-item:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary, var(--dsw-static-blue-450));
  outline-offset: 2px;
}
.dshWebSearchSeg-item:disabled {
  cursor: default;
  opacity: 0.45;
}
.dshWebSearchKeys-hint {
  margin: 0;
  padding: 6px 0 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchTabs {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 12px 0 8px;
}
.dshWebSearchTabs-bar {
  display: flex;
  align-items: stretch;
  gap: 4px;
  min-width: 0;
}
.dshWebSearchTabs-strip {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  gap: 4px;
  align-items: stretch;
}
.dshWebSearchTabs-bar.is-scroll .dshWebSearchTabs-strip {
  overflow-x: auto;
  flex-wrap: nowrap;
  scrollbar-width: thin;
  -webkit-mask-image: linear-gradient(to right, #000 92%, transparent);
  mask-image: linear-gradient(to right, #000 92%, transparent);
}
.dshWebSearchTab {
  appearance: none;
  margin: 0;
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  min-height: 40px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-3, transparent);
  color: var(--dsw-alias-label-secondary);
  transition: color .16s ease, background .16s ease, border-color .16s ease;
}
.dshWebSearchTab:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
  border-color: var(--dsw-alias-label-dimmed, var(--dsw-alias-border-l2));
}
.dshWebSearchTab.is-on {
  color: var(--dsw-static-blue-450, currentColor);
  border-color: color-mix(in srgb, var(--dsw-static-blue-450, currentColor) 40%, transparent);
  background: color-mix(in srgb, var(--dsw-static-blue-450, currentColor) 10%, transparent);
  font-weight: 600;
}
.dshWebSearchTab.is-active-vendor.is-on {
  border-color: var(--dsw-static-blue-450, currentColor);
}
.dshWebSearchTab:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-static-blue-450));
  outline-offset: 2px;
}
.dshWebSearchTab:disabled {
  cursor: default;
  opacity: 0.55;
}
.dshWebSearchTab-name {
  font-size: 13px;
  line-height: 1.3;
  white-space: nowrap;
}
.dshWebSearchTab-badge {
  white-space: nowrap;
  background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-interactive-bg-hover));
  color: var(--dsw-alias-label-secondary);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 10px;
  font-weight: 500;
  line-height: 16px;
}
.dshWebSearchTab-badge.is-on {
  color: var(--dsw-static-blue-450, currentColor);
  background: color-mix(in srgb, var(--dsw-static-blue-450, currentColor) 14%, transparent);
}
.dshWebSearchTab-badge.is-ready {
  color: var(--dsw-static-green-450, #34d399);
  background: color-mix(in srgb, var(--dsw-static-green-450, #34d399) 16%, transparent);
}
.dshWebSearchTab-badge.is-off {
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchTabs-moreWrap {
  position: relative;
  flex: none;
}
.dshWebSearchTabs-more {
  appearance: none;
  margin: 0;
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 40px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-3, transparent);
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: color .16s ease, background .16s ease, border-color .16s ease;
}
.dshWebSearchTabs-more:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
}
.dshWebSearchTabs-more.is-open,
.dshWebSearchTabs-more:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-static-blue-450));
  outline-offset: 2px;
}
.dshWebSearchTabs-more:disabled {
  cursor: default;
  opacity: 0.55;
}
.dshWebSearchTabs-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 4;
  min-width: 12em;
  margin: 0;
  padding: 4px;
  list-style: none;
  border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-3));
  box-shadow: 0 8px 24px color-mix(in srgb, #000 16%, transparent);
}
.dshWebSearchTabs-menuItem {
  appearance: none;
  width: 100%;
  margin: 0;
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  text-align: left;
}
.dshWebSearchTabs-menuItem:hover {
  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, currentColor 8%, transparent));
}
.dshWebSearchTabs-menuItem.is-on {
  background: color-mix(in srgb, var(--dsw-static-blue-450, #4d7cff) 10%, transparent);
}
.dshWebSearchTabs-menuName {
  font-size: 13px;
  font-weight: 500;
}
.dshWebSearchPanel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-2, transparent);
  padding: 4px 16px 16px;
  margin-top: 10px;
}
.dshWebSearchPanel:focus {
  outline: none;
}
.dshWebSearchPanel:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-static-blue-450));
  outline-offset: 2px;
}
.dshWebSearchPanel .dshWebSearchField {
  padding: 12px 0 0;
}
.dshWebSearchPanel .dshWebSearchField + .dshWebSearchField,
.dshWebSearchPanel .dshWebSearchField + .dshWebSearchDetails,
.dshWebSearchPanel .dshWebSearchPanel-note + .dshWebSearchField {
  border-top: 1px solid var(--dsw-alias-border-l2);
  padding-top: 12px;
  margin-top: 12px;
}
.dshWebSearchPanel-note {
  margin: 0;
  padding: 12px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchExt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 4px 2px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--dsw-static-blue-450, #4d7cff);
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
  border-radius: 6px;
  transition: color .16s ease, background .16s ease;
}
.dshWebSearchExt:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.dshWebSearchExt:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-static-blue-450));
  outline-offset: 2px;
}
.dshWebSearchExt-icon {
  flex: none;
}
.dshWebSearchNote {
  margin: 0;
  padding: 12px 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchSecret {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dshWebSearchSecret .dshWebSearchField-input {
  flex: 1;
  min-width: 12em;
}
.dshWebSearchSecret-saved {
  font-size: 11px;
  font-weight: 500;
  color: var(--dsw-static-green-450, #34d399);
}
.dshWebSearchSecret-clear {
  appearance: none;
  margin: 0;
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
  min-height: 36px;
  padding: 4px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}
.dshWebSearchSecret-clear:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, currentColor 8%, transparent));
}
.dshWebSearchSecret-clear:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-static-blue-450));
  outline-offset: 2px;
}
.dshWebSearchSecret-clear:disabled {
  cursor: default;
  opacity: 0.45;
}
.dshWebSearchDetails {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
}
.dshWebSearchDetails > summary,
.dshWebSearchMore > summary {
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--dsw-alias-label-secondary);
  min-height: 36px;
  display: flex;
  align-items: center;
}
.dshWebSearchMore {
  padding: 12px 0 0;
}
.dshWebSearchStatus-empty {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchHint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchProbe {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.dshWebSearchProbe-btn {
  font: inherit;
  cursor: pointer;
  touch-action: manipulation;
  padding: 8px 14px;
  min-height: 40px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l3, color-mix(in srgb, currentColor 18%, transparent));
  background: transparent;
  color: inherit;
  transition: background .16s ease, border-color .16s ease, color .16s ease;
}
.dshWebSearchProbe-btn:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, currentColor 8%, transparent));
}
.dshWebSearchProbe-btn.is-primary {
  background: var(--dsw-static-blue-450, #4d7cff);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}
.dshWebSearchProbe-btn.is-primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--dsw-static-blue-450, #4d7cff) 88%, #000);
}
.dshWebSearchProbe-btn:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-static-blue-450));
  outline-offset: 1px;
}
.dshWebSearchProbe-btn:disabled {
  cursor: default;
}
.dshWebSearchProbe-btn:disabled:not(.is-primary) {
  color: var(--dsw-alias-label-secondary);
  opacity: 0.72;
}
.dshWebSearchProbe-btn.is-primary:disabled,
.dshWebSearchProbe-btn.is-primary[aria-busy='true'] {
  color: #fff;
  opacity: 0.88;
}
.dshWebSearchProbe-msg {
  margin: 0;
  flex: 1 1 12em;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary);
}
.dshWebSearchProbe-msg.is-ok {
  color: var(--dsw-static-green-450, #34d399);
}
.dshWebSearchProbe-msg.is-bad {
  color: var(--dsw-static-red-450, #f87171);
}
@media (prefers-reduced-motion: reduce) {
  .dshWebSearchSwitch-track,
  .dshWebSearchSwitch-thumb,
  .dshWebSearchSeg-item,
  .dshWebSearchTab,
  .dshWebSearchTabs-more,
  .dshWebSearchExt,
  .dshWebSearchSecret-clear,
  .dshWebSearchProbe-btn {
    transition: none;
  }
}
@media (max-width: 520px) {
  .dshWebSearchSummary-end {
    margin-left: 0;
    align-items: flex-start;
  }
}
`

export function ensureSearchStyles(): () => void {
  if (typeof document === 'undefined') return () => undefined
  const selector = `style[data-plugin-css=${JSON.stringify(TAG_ID)}]`
  let tag = document.querySelector(selector) as HTMLStyleElement | null
  if (!tag) {
    tag = document.createElement('style')
    tag.dataset.plugin = 'dsh-web-search'
    tag.dataset.pluginCss = TAG_ID
    document.head.appendChild(tag)
  }
  tag.textContent = CSS
  return () => tag.remove()
}
