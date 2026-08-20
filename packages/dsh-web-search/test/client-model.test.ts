import { describe, expect, it } from 'vitest'
import { firstOpenProvider, PROVIDER_KEY_URLS, VENDOR_ORDER, vendorTabLayout } from '../src/client/model.ts'

describe('PROVIDER_KEY_URLS', () => {
  it('points every vendor at an https console', () => {
    for (const id of VENDOR_ORDER) {
      expect(PROVIDER_KEY_URLS[id]).toMatch(/^https:\/\//)
    }
  })
})

describe('firstOpenProvider', () => {
  const none = () => false
  const onlyTavily = (id: string) => id === 'tavily'

  it('opens the explicit vendor even when it has no key', () => {
    expect(firstOpenProvider('doubao', null, none)).toBe('doubao')
  })

  it('opens the active auto backend when one is ready', () => {
    expect(firstOpenProvider('auto', 'tavily', onlyTavily)).toBe('tavily')
  })

  it('opens the first missing vendor so a first-run user sees Get API key', () => {
    expect(firstOpenProvider('auto', null, none)).toBe('baidu')
  })
})

describe('vendorTabLayout', () => {
  it('shows every vendor when maxVisible covers the registry', () => {
    const layout = vendorTabLayout(VENDOR_ORDER, 'exa', VENDOR_ORDER.length)
    expect(layout.visible).toEqual(VENDOR_ORDER)
    expect(layout.overflow).toEqual([])
    expect(layout.scrollAll).toBe(false)
  })

  it('keeps the selected vendor in a contiguous visible window', () => {
    const layout = vendorTabLayout(VENDOR_ORDER, 'exa', 2)
    expect(layout.visible).toEqual(['tavily', 'exa'])
    expect(layout.overflow).toEqual(['baidu', 'doubao'])
    expect(layout.scrollAll).toBe(false)
  })

  it('slides the window when the overflow selection changes', () => {
    const baidu = vendorTabLayout(VENDOR_ORDER, 'baidu', 2)
    expect(baidu.visible).toEqual(['baidu', 'doubao'])

    const doubao = vendorTabLayout(VENDOR_ORDER, 'doubao', 2)
    expect(doubao.visible).toEqual(['doubao', 'tavily'])

    const tavily = vendorTabLayout(VENDOR_ORDER, 'tavily', 2)
    expect(tavily.visible).toEqual(['tavily', 'exa'])
  })

  it('uses horizontal scroll when nothing fits beside More', () => {
    const layout = vendorTabLayout(VENDOR_ORDER, 'baidu', 0)
    expect(layout.visible).toEqual(VENDOR_ORDER)
    expect(layout.overflow).toEqual([])
    expect(layout.scrollAll).toBe(true)
  })
})
