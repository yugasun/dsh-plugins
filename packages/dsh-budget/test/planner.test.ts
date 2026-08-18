import { describe, expect, it } from 'vitest'
import { failOpen } from '../src/fail-open.ts'
import { planRequest, type Contributor } from '../src/planner.ts'
import { estimateTokens } from '../src/estimate.ts'
import { shrinkToTokens } from '../src/text.ts'

const caps = {
  enabled: true,
  toolResultMaxTokens: 200,
}

function tool(tokens: number, key = 'tool-result:bash'): Contributor {
  return { key, tokens, lifetime: 'step', kind: 'tool-result' }
}

describe('planRequest', () => {
  it('returns identity when disabled', () => {
    const plan = planRequest([tool(8000)], { ...caps, enabled: false })
    expect(plan.contributors.every((item) => item.action === 'keep')).toBe(true)
    expect(plan.savedTokens).toBe(0)
    expect(plan.afterTokens).toBe(plan.beforeTokens)
  })

  it('keeps tool results under the per-result cap', () => {
    const plan = planRequest([tool(80)], caps)
    expect(plan.contributors.every((item) => item.action === 'keep')).toBe(true)
    expect(plan.savedTokens).toBe(0)
  })

  it('spills a tool result over the per-result cap', () => {
    const plan = planRequest([tool(800)], caps)
    expect(plan.contributors[0]?.action).toBe('spill')
    expect(plan.contributors[0]?.afterTokens).toBe(200)
    expect(plan.savedTokens).toBe(600)
  })

  it('leaves non-tool-result contributors alone', () => {
    const plan = planRequest(
      [{ key: 'history:0', tokens: 9000, lifetime: 'step' }, tool(80)],
      caps,
    )
    const history = plan.contributors.find((item) => item.key === 'history:0')
    expect(history?.action).toBe('keep')
    expect(history?.afterTokens).toBe(9000)
  })
})

describe('failOpen', () => {
  it('returns the fallback when enabled', async () => {
    const result = await failOpen(
      async () => {
        throw new Error('boom')
      },
      7,
      () => undefined,
      true,
    )
    expect(result).toBe(7)
  })

  it('rethrows when disabled', async () => {
    await expect(
      failOpen(
        async () => {
          throw new Error('boom')
        },
        7,
        () => undefined,
        false,
      ),
    ).rejects.toThrow('boom')
  })
})

describe('estimate + shrink', () => {
  it('estimates empty text as zero', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('shrinks text to the token budget', () => {
    const huge = 'abcd'.repeat(2000)
    const next = shrinkToTokens(huge, 20)
    expect(estimateTokens(next)).toBeLessThanOrEqual(20)
    expect(next.length).toBeLessThan(huge.length)
  })
})
