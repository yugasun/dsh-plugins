import { describe, expect, it } from 'vitest'
import { resolveHostPackage } from '../src/host.ts'

describe('resolveHostPackage', () => {
  it('finds harness packages when this tree is outside the dsh profile', () => {
    expect(resolveHostPackage('@deepseek-ai/dsh-settings')).toMatch(/dsh-settings/)
    expect(resolveHostPackage('@deepseek-ai/dsh-web')).toMatch(/dsh-web/)
    expect(resolveHostPackage('@deepseek-ai/schemastery')).toMatch(/schemastery/)
  })
})
