const TAG_ID = 'dsh-budget/web-ui.css'

const CSS = `
.dshBudgetChip {
  display: inline-flex;
  position: relative;
}
.dshBudgetChip-trigger {
  height: 28px;
  padding: 0 8px 0 4px;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 999px;
  flex: none;
  align-items: center;
  gap: 4px;
  display: inline-flex;
  font: inherit;
  font-size: 12px;
  line-height: 20px;
}
.dshBudgetChip-label {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.dshBudgetChip-trigger:hover,
.dshBudgetChip-trigger[aria-expanded="true"] {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dshBudgetChip-trigger:disabled {
  cursor: default;
  opacity: 0.45;
}
.dshBudgetChip-track {
  fill: none;
  stroke: var(--dsw-alias-border-l3);
  stroke-width: 2px;
}
.dshBudgetChip-fill {
  fill: none;
  stroke: var(--dsw-static-blue-450, currentColor);
  stroke-width: 2px;
  stroke-linecap: round;
}
.dshBudgetChip-fill.is-off {
  stroke: var(--dsw-alias-label-tertiary);
}
.dshBudgetChip-fill.is-saved {
  stroke: var(--dsw-static-green-450, #34d399);
}
.dshBudgetChip-panel {
  z-index: 100;
  box-sizing: border-box;
  border: 1px solid var(--dsw-alias-border-inverted);
  background: var(--dsw-specific-menu);
  width: 264px;
  box-shadow: var(--dsw-shadow-lv3);
  color: var(--dsw-alias-label-secondary);
  cursor: default;
  border-radius: 12px;
  padding: 12px;
  font-size: 12px;
  line-height: 20px;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
}
.dshBudgetChip-header {
  align-items: center;
  gap: 6px;
  display: flex;
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
}
.dshBudgetChip-figures {
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-primary);
  margin-left: auto;
  font-weight: 500;
}
.dshBudgetChip-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 0;
  cursor: pointer;
  color: var(--dsw-alias-label-primary);
}
.dshBudgetChip-meta {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.dshBudgetChip-empty {
  margin-top: 8px;
  color: var(--dsw-alias-label-tertiary);
}
.dshBudgetBar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}
.dshBudgetBar-label {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.dshBudgetBar-track {
  height: 4px;
  border-radius: 999px;
  background: var(--dsw-alias-interactive-bg-hover);
  overflow: hidden;
}
.dshBudgetBar-fill {
  height: 100%;
  background: var(--dsw-alias-label-tertiary);
  border-radius: 999px;
}
.dshBudgetBar-fill.is-after {
  background: var(--dsw-static-blue-450, currentColor);
}
.dshBudgetDock {
  text-align: center;
  max-width: var(--dsh-chat-content-width);
  box-sizing: border-box;
  width: 100%;
  padding: 4px calc(var(--dsh-composer-side-clearance, 0px) + 16px) 0;
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap;
  text-overflow: ellipsis;
  margin: 0 auto;
  font-size: 12px;
  line-height: 20px;
  display: block;
  overflow: hidden;
  font-variant-numeric: tabular-nums;
}
.dshBudgetDock-sep {
  color: var(--dsw-alias-separator-primary);
  margin: 0 10px;
}
.dshBudgetPage {
  max-width: 760px;
  color: var(--dsw-alias-label-primary);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dshBudgetPage-heading {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.dshBudgetPage-intro {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshBudgetForm {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 4px;
}
.dshBudgetField {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dshBudgetField-label {
  font-size: 13px;
  font-weight: 600;
}
.dshBudgetField-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dshBudgetField-control {
  align-items: center;
  gap: 8px;
  display: flex;
  flex-wrap: wrap;
}
.dshBudgetField-input {
  font: inherit;
  width: 8.5em;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l3, color-mix(in srgb, currentColor 18%, transparent));
  background: transparent;
  color: inherit;
}
.dshBudgetField-unit,
.dshBudgetField-aside {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.dshBudgetToggle {
  align-items: center;
  gap: 8px;
  display: inline-flex;
  font-size: 13px;
  cursor: pointer;
}
.dshBudgetStatus {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid var(--dsw-alias-border-l3, color-mix(in srgb, currentColor 12%, transparent));
}
.dshBudgetStatus-title {
  font-size: 13px;
  font-weight: 600;
}
.dshBudgetStatus-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.dshBudgetStatus-empty {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
`

export function ensureBudgetStyles(): () => void {
  if (typeof document === 'undefined') return () => undefined
  const existing = document.querySelector(`style[data-plugin-css=${JSON.stringify(TAG_ID)}]`)
  if (existing) {
    return () => existing.remove()
  }
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-budget'
  tag.dataset.pluginCss = TAG_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
  return () => tag.remove()
}
