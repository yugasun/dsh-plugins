import { describe, expect, it } from 'vitest'
import { StatsStore } from '../src/stats.ts'
import {
  acceptedPlainText,
  budgetAcceptedText,
  flattenPlainText,
  isRewritableAccept,
  skipReason,
} from '../src/hooks/tool-content.ts'

const caps = {
  enabled: true,
  maxInputTokens: 64_000,
  toolResultMaxTokens: 256,
  failOpen: true,
}

describe('acceptedPlainText', () => {
  it('reads result content when the accept decision does not replace value', () => {
    const text = acceptedPlainText(
      { kind: 'accept' },
      [{ type: 'text', text: 'hello world' }],
    )
    expect(text).toBe('hello world')
  })

  it('still reads nested Code Mode results (parent is not a reason to skip)', () => {
    const dump = 'x'.repeat(2000)
    const text = acceptedPlainText({ kind: 'accept' }, [{ type: 'text', text: dump }])
    const trimmed = budgetAcceptedText(text!, caps, 'tool-result:read')
    expect(trimmed).toBeDefined()
    expect(trimmed!.plan.savedTokens).toBeGreaterThan(0)
    expect(trimmed!.plan.contributors[0]?.action).toBe('spill')
  })

  it('does not rewrite an accept that replaced the canonical value', () => {
    expect(isRewritableAccept({ kind: 'accept', value: { lines: [] } })).toBe(false)
    expect(
      acceptedPlainText({ kind: 'accept', value: { lines: [] } }, [{ type: 'text', text: 'x'.repeat(2000) }]),
    ).toBeUndefined()
    expect(skipReason({ kind: 'accept', value: { lines: [] } }, [{ type: 'text', text: 'x' }])).toBe(
      'value-replacement',
    )
  })

  it('reads nested tool-result wrappers the session log uses', () => {
    expect(
      flattenPlainText([
        {
          type: 'tool-result',
          content: [{ type: 'text', text: 'hello ' }, { type: 'text', text: 'world' }],
        },
      ]),
    ).toBe('hello world')
  })

  it('leaves mixed image+text results alone', () => {
    expect(
      flattenPlainText([
        { type: 'text', text: 'caption' },
        { type: 'image' },
      ]),
    ).toBeUndefined()
  })
})

describe('StatsStore', () => {
  it('accumulates saved tokens and spill count when a trim is recorded', () => {
    const stats = new StatsStore()
    const trimmed = budgetAcceptedText('y'.repeat(4000), caps, 'tool-result:bash')
    expect(trimmed).toBeDefined()
    stats.record(trimmed!.plan)
    const snap = stats.snapshot()
    expect(snap.spillCount).toBe(1)
    expect(snap.savedTokens).toBe(trimmed!.plan.savedTokens)
    expect(snap.lastPlan).not.toBeNull()
    expect(snap.postSeen).toBe(0)
    expect(snap.caps).toBeNull()
  })
})
