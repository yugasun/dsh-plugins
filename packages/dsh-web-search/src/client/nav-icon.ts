const LABELS = new Set(['网络搜索', 'Web search'])
const MARK = 'data-dsh-web-search-nav'

/** Official `IconSearchOutline16` paths, used because the settings shell hardcodes nav glyphs by section id. */
function searchIcon(className: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '16')
  svg.setAttribute('height', '16')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute(MARK, '')
  if (className) svg.setAttribute('class', className)
  for (const d of [
    'M11.894845 6.647401C11.894845 3.725463 9.534486 1.356779 6.623219 1.35657C3.711786 1.35657 1.351635 3.725338 1.351635 6.647401C1.351843 9.569296 3.711911 11.938273 6.623219 11.938273C9.534361 11.938064 11.894637 9.569171 11.894845 6.647401ZM13.245462 6.647401C13.245254 10.317935 10.280401 13.293613 6.623219 13.293821C2.965871 13.293821 0.000204 10.31806 0 6.647401C0 2.976574 2.965746 0 6.623219 0C10.280526 0.000205 13.245462 2.9767 13.245462 6.647401Z',
    'M16.000417 15.041079L15.044449 16.000433L11.530434 12.473588L12.486298 11.514234L16.000417 15.041079Z',
  ]) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', d)
    path.setAttribute('fill', 'currentColor')
    svg.append(path)
  }
  return svg
}

function patchNavIcons(): void {
  for (const button of Array.from(document.querySelectorAll('[role="dialog"] nav button'))) {
    const label = button.querySelector('span')?.textContent?.trim() ?? ''
    if (!LABELS.has(label)) continue
    const current = button.querySelector('svg')
    if (!current || current.hasAttribute(MARK)) continue
    current.replaceWith(searchIcon(current.getAttribute('class') ?? ''))
  }
}

export function watchSettingsNavIcon(): () => void {
  if (typeof document === 'undefined' || !document.body) return () => undefined
  const observer = new MutationObserver(patchNavIcons)
  observer.observe(document.body, { childList: true, subtree: true })
  patchNavIcons()
  return () => observer.disconnect()
}
