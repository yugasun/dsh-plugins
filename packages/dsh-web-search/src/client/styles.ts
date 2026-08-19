const TAG_ID = 'dsh-web-search/web-ui.v2.css'

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
  width: 40px;
  height: 24px;
  display: inline-flex;
  cursor: pointer;
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
  width: 40px;
  height: 24px;
  border-radius: 999px;
  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, currentColor 12%, transparent));
  border: 1px solid var(--dsw-alias-border-l3, color-mix(in srgb, currentColor 18%, transparent));
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 2px;
  transition: background .16s, border-color .16s;
}
.dshWebSearchSwitch.is-on .dshWebSearchSwitch-track {
  background: var(--dsw-static-blue-450, #4d7cff);
  border-color: transparent;
}
.dshWebSearchSwitch-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px color-mix(in srgb, #000 20%, transparent);
  transform: translateX(0);
  transition: transform .16s;
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
.dshWebSearchField + .dshWebSearchField,
.dshWebSearchField + .dshWebSearchNote,
.dshWebSearchField + .dshWebSearchKeys,
.dshWebSearchNote + .dshWebSearchHint,
.dshWebSearchList + .dshWebSearchMore {
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
  padding: 7px 10px;
  min-height: 32px;
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
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, currentColor 8%, transparent));
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 12px;
  min-height: 32px;
  font-size: 13px;
  line-height: 20px;
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
.dshWebSearchKeys {
  padding: 16px 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
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
  padding: 8px 0 12px;
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
  min-height: 44px;
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
.dshWebSearchCard-note {
  margin: 0;
  padding: 0 0 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
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
.dshWebSearchDetails > summary,
.dshWebSearchMore > summary {
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--dsw-alias-label-secondary);
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
  padding: 6px 12px;
  min-height: 32px;
  border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l3, color-mix(in srgb, currentColor 18%, transparent));
  background: transparent;
  color: inherit;
}
.dshWebSearchProbe-btn:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, currentColor 8%, transparent));
}
.dshWebSearchProbe-btn:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, var(--dsw-static-blue-450));
  outline-offset: 1px;
}
.dshWebSearchProbe-btn:disabled {
  cursor: default;
  color: var(--dsw-alias-label-tertiary);
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
  .dshWebSearchCard,
  .dshWebSearchCard-chevron {
    transition: none;
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
