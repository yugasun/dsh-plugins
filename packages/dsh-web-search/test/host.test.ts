import { describe, expect, it } from 'vitest'
import * as host from '../src/host.ts'
import { resolveHostPackage } from '../src/host.ts'

describe('resolveHostPackage', () => {
  it('finds harness packages when this tree is outside the dsh profile', () => {
    expect(resolveHostPackage('@deepseek-ai/dsh-settings')).toMatch(/dsh-settings/)
    expect(resolveHostPackage('@deepseek-ai/dsh-web')).toMatch(/dsh-web/)
    expect(resolveHostPackage('@deepseek-ai/schemastery')).toMatch(/schemastery/)
  })

  it('does not import removed dsh-settings helpers at load time', () => {
    expect(host).not.toHaveProperty('installSettingsSection')
    expect(host).not.toHaveProperty('settingsNamespace')
  })
})
