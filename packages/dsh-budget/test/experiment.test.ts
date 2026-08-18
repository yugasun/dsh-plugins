import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../src/config.ts'
import { estimateTokens } from '../src/estimate.ts'
import { fixtureDump, runSessionLogExperiment } from '../src/experiment.ts'

describe('session log experiment', () => {
  it('keeps identical event shapes and only shrinks tool/result', () => {
    const result = runSessionLogExperiment(DEFAULT_CONFIG)
    expect(result.control.events).toBe(result.treatment.events)
    expect(result.diffs).toHaveLength(1)
    expect(result.diffs[0]?.type).toBe('tool/result')
    expect(result.treatment.preview).toContain('spill://fixture/bash.txt')
    expect(result.control.preview).not.toContain('spill://fixture')
  })

  it('cuts about 90% off a 40k-token bash dump at the default cap', () => {
    const result = runSessionLogExperiment(DEFAULT_CONFIG)
    expect(result.fixture.sourceTokens).toBeGreaterThanOrEqual(40_000)
    expect(result.control.tokens).toBeGreaterThan(result.treatment.tokens)
    expect(result.control.bytes).toBeGreaterThan(result.treatment.bytes)
    expect(result.savedPercent).toBeGreaterThanOrEqual(85)
    expect(result.plan.afterTokens).toBeLessThanOrEqual(DEFAULT_CONFIG.toolResultMaxTokens)
    expect(estimateTokens(fixtureDump())).toBe(result.fixture.sourceTokens)
  })

  it('follows the current tool-result cap', () => {
    const tight = runSessionLogExperiment({ ...DEFAULT_CONFIG, toolResultMaxTokens: 256 })
    const loose = runSessionLogExperiment({ ...DEFAULT_CONFIG, toolResultMaxTokens: 8000 })
    expect(tight.treatment.tokens).toBeLessThan(loose.treatment.tokens)
    expect(tight.savedPercent).toBeGreaterThan(loose.savedPercent)
  })
})
