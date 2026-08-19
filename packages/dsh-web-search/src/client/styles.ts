const TAG_ID = 'dsh-web-search/web-ui.css'

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
}
.dshWebSearchPage-intro {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchForm {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
}
.dshWebSearchField {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
}
.dshWebSearchField + .dshWebSearchField,
.dshWebSearchField + .dshWebSearchNote,
.dshWebSearchField + .dshWebSearchList,
.dshWebSearchNote + .dshWebSearchHint,
.dshWebSearchList + .dshWebSearchHint {
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
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l3, color-mix(in srgb, currentColor 18%, transparent));
  background: transparent;
  color: inherit;
}
.dshWebSearchField-input:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-static-blue-450));
  outline-offset: 1px;
}
.dshWebSearchToggle {
  align-items: center;
  gap: 8px;
  display: inline-flex;
  font-size: 13px;
  cursor: pointer;
  color: var(--dsw-alias-label-primary);
}
.dshWebSearchToggle input:disabled + span {
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchTabs {
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  align-items: flex-end;
  gap: 22px;
  display: flex;
  flex-wrap: wrap;
  margin-top: 2px;
}
.dshWebSearchTabs-item {
  appearance: none;
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
  font: inherit;
  cursor: pointer;
  background: 0 0;
  border: 0;
  padding: 7px 1px 9px;
  font-size: 13px;
  line-height: 20px;
  position: relative;
}
.dshWebSearchTabs-item:hover,
.dshWebSearchTabs-item.is-on {
  color: var(--dsw-alias-label-primary);
}
.dshWebSearchTabs-item.is-on:after,
.dshWebSearchTabs-item:focus-visible:after {
  background: var(--dsw-alias-label-primary);
  content: "";
  border-radius: 2px 2px 0 0;
  height: 2px;
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
}
.dshWebSearchTabs-item:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary, var(--dsw-static-blue-450));
  outline-offset: 2px;
  color: var(--dsw-alias-label-primary);
  border-radius: 2px;
}
.dshWebSearchTabs-item:disabled {
  cursor: default;
  opacity: 0.45;
}
.dshWebSearchActive {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchNote {
  margin: 0;
  padding: 12px 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchList {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
}
.dshWebSearchCard {
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-3, transparent);
  border-radius: 12px;
  list-style: none;
  overflow: hidden;
  transition: border-color .16s, background .16s;
}
.dshWebSearchCard:hover,
.dshWebSearchCard.is-open {
  border-color: var(--dsw-alias-label-dimmed, var(--dsw-alias-border-l2));
}
.dshWebSearchCard.is-open {
  background: var(--dsw-alias-bg-layer-2, transparent);
}
.dshWebSearchCard.is-on {
  border-color: var(--dsw-static-blue-450, currentColor);
}
.dshWebSearchCard-head {
  appearance: none;
  width: 100%;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: 0 0;
  border: 0;
  border-radius: 12px;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  display: flex;
}
.dshWebSearchCard-head:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-static-blue-450));
  outline-offset: -2px;
}
.dshWebSearchCard-text {
  flex-direction: column;
  flex: 1;
  gap: 4px;
  min-width: 0;
  display: flex;
}
.dshWebSearchCard-name {
  color: var(--dsw-alias-label-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}
.dshWebSearchCard-desc {
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 1.5;
}
.dshWebSearchCard-badge {
  white-space: nowrap;
  background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-interactive-bg-hover));
  color: var(--dsw-alias-label-secondary);
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  line-height: 17px;
}
.dshWebSearchCard-badge.is-on {
  color: var(--dsw-static-blue-450, currentColor);
  background: color-mix(in srgb, var(--dsw-static-blue-450, currentColor) 14%, transparent);
}
.dshWebSearchCard-badge.is-ready {
  color: var(--dsw-static-green-450, #34d399);
  background: color-mix(in srgb, var(--dsw-static-green-450, #34d399) 16%, transparent);
}
.dshWebSearchCard-badge.is-off {
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchCard-chevron {
  width: 6px;
  height: 6px;
  flex: none;
  border-right: 1.5px solid var(--dsw-alias-label-tertiary);
  border-bottom: 1.5px solid var(--dsw-alias-label-tertiary);
  transform: rotate(-45deg);
  margin-left: 2px;
  transition: transform .16s;
}
.dshWebSearchCard-chevron.is-open {
  transform: rotate(45deg);
  margin-top: -2px;
}
.dshWebSearchCard-body {
  display: flex;
  flex-direction: column;
  padding: 0 16px 16px;
}
.dshWebSearchCard-body .dshWebSearchField {
  padding: 12px 0 0;
}
.dshWebSearchCard-body .dshWebSearchField + .dshWebSearchField,
.dshWebSearchCard-body .dshWebSearchField + .dshWebSearchDetails {
  border-top: 1px solid var(--dsw-alias-border-l2);
  padding-top: 12px;
  margin-top: 12px;
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
.dshWebSearchDetails {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
}
.dshWebSearchDetails > summary {
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--dsw-alias-label-secondary);
}
.dshWebSearchStatus-empty {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchHint {
  margin: 0;
  padding: 12px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchProbe {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.dshWebSearchProbe-btn {
  font: inherit;
  width: fit-content;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l3, color-mix(in srgb, currentColor 18%, transparent));
  background: transparent;
  color: inherit;
}
.dshWebSearchProbe-btn:disabled {
  cursor: default;
  color: var(--dsw-alias-label-tertiary);
}
.dshWebSearchProbe-msg {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary);
}
.dshWebSearchProbe-msg.is-ok {
  color: var(--dsw-static-green-450, #34d399);
}
.dshWebSearchProbe-msg.is-bad {
  color: var(--dsw-alias-label-tertiary);
}
`

export function ensureSearchStyles(): () => void {
  if (typeof document === 'undefined') return () => undefined
  const existing = document.querySelector(`style[data-plugin-css=${JSON.stringify(TAG_ID)}]`)
  if (existing) {
    return () => existing.remove()
  }
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-web-search'
  tag.dataset.pluginCss = TAG_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
  return () => tag.remove()
}
