import { describe, expect, it } from 'vitest'
import { failOpen } from '../src/fail-open.ts'
import { planRequest, type Contributor } from '../src/planner.ts'
import { estimateTokens } from '../src/estimate.ts'
import { shrinkToTokens } from '../src/text.ts'

const caps = {
  enabled: true,
  maxInputTokens: 1000,
  toolResultMaxTokens: 200,
}

function tool(tokens: number, key = 'tool-result:bash'): Contributor {
  return { key, tokens, lifetime: 'step', kind: 'tool-result' }
}

function history(tokens: number, key = 'history:0'): Contributor {
  return { key, tokens, lifetime: 'turn', kind: 'history' }
}

function system(tokens: number): Contributor {
  return { key: 'system', tokens, lifetime: 'profile', kind: 'system', required: true }
}

describe('planRequest', () => {
  it('returns identity when disabled', () => {
    const plan = planRequest([tool(8000), history(100)], { ...caps, enabled: false })
    expect(plan.contributors.every((item) => item.action === 'keep')).toBe(true)
    expect(plan.savedTokens).toBe(0)
    expect(plan.afterTokens).toBe(plan.beforeTokens)
  })

  it('keeps contributors under both caps', () => {
    const plan = planRequest([system(100), history(50), tool(80)], caps)
    expect(plan.contributors.every((item) => item.action === 'keep')).toBe(true)
    expect(plan.savedTokens).toBe(0)
  })

  it('spills a tool result over the per-result cap', () => {
    const plan = planRequest([tool(800)], caps)
    expect(plan.contributors[0]?.action).toBe('spill')
    expect(plan.contributors[0]?.afterTokens).toBe(200)
    expect(plan.savedTokens).toBe(600)
  })

  it('cuts tool results before history when the total budget is exceeded', () => {
    const plan = planRequest(
      [system(100), tool(180), history(900)],
      { enabled: true, maxInputTokens: 400, toolResultMaxTokens: 500 },
    )
    const toolItem = plan.contributors.find((item) => item.kind === 'tool-result')
    const historyItem = plan.contributors.find((item) => item.kind === 'history')
    const systemItem = plan.contributors.find((item) => item.required)
    expect(toolItem?.afterTokens).toBeLessThan(180)
    expect(historyItem?.action).toBe('summarize')
    expect(systemItem?.action).toBe('keep')
    expect(systemItem?.afterTokens).toBe(100)
    expect(plan.afterTokens).toBeLessThanOrEqual(400)
  })

  it('never drops a required system contributor', () => {
    const plan = planRequest(
      [system(300), history(300)],
      { enabled: true, maxInputTokens: 200, toolResultMaxTokens: 50 },
    )
    const systemItem = plan.contributors.find((item) => item.required)
    expect(systemItem?.action).toBe('keep')
    expect(systemItem?.afterTokens).toBe(300)
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
