import { describe, expect, it } from 'vitest'
import { enforceSurfaceBudget, pruneToolResultsOnSurface } from '../src/hooks/surface-prune.ts'
import type { SessionEventLike, SessionLike } from '../src/host-types.ts'

function toolResultEvent(seq: number, text: string): SessionEventLike {
  return {
    type: 'tool/result',
    seq,
    data: {
      turn: 1,
      step: 1,
      message: {
        role: 'user',
        content: [
          {
            type: 'tool-result',
            toolCallId: `call-${seq}`,
            isError: false,
            content: [{ type: 'text', text }],
          },
        ],
      },
    },
  }
}

function mockSession(events: SessionEventLike[]): SessionLike & { appended: unknown[] } {
  const appended: unknown[] = []
  const session: SessionLike & { appended: unknown[] } = {
    events,
    surface: { nodes: events.map((_, index) => index) },
    appended,
    append(type, data, opts) {
      appended.push({ type, data, opts })
      return { seq: events.length + appended.length }
    },
  }
  return session
}

describe('pruneToolResultsOnSurface', () => {
  it('leaves results under the cap untouched', () => {
    const session = mockSession([toolResultEvent(0, 'short')])
    const result = pruneToolResultsOnSurface(session, 256)
    expect(result.count).toBe(0)
    expect(session.appended).toHaveLength(0)
  })

  it('replaces an oversized plain-text tool result and records savings', () => {
    const session = mockSession([toolResultEvent(0, 'x'.repeat(4000))])
    const result = pruneToolResultsOnSurface(session, 256)
    expect(result.count).toBe(1)
    expect(result.plan?.savedTokens).toBeGreaterThan(0)
    expect(session.appended[0]).toMatchObject({ type: 'compaction/prune' })
    expect(session.appended[1]).toMatchObject({
      type: 'tool/result',
      opts: { surfaceOp: { op: 'replace', start: 0, end: 0 }, sourceEventSeqs: [0] },
    })
    const replacement = session.appended[1] as { data: { message: { content: Array<{ type: string; toolCallId: string; isError: boolean; content: Array<{ text: string }> }> } } }
    const block = replacement.data.message.content[0]
    expect(block.type).toBe('tool-result')
    expect(block.toolCallId).toBe('call-0')
    expect(block.isError).toBe(false)
    expect(block.content[0]?.text).not.toBe('x'.repeat(4000))
  })

  it('skips mixed image+text results', () => {
    const session = mockSession([
      {
        type: 'tool/result',
        data: {
          message: {
            content: [
              {
                type: 'tool-result',
                content: [{ type: 'text', text: 'x'.repeat(4000) }, { type: 'image' }],
              },
            ],
          },
        },
      },
    ])
    expect(pruneToolResultsOnSurface(session, 256).count).toBe(0)
  })
})

describe('enforceSurfaceBudget', () => {
  it('shrinks older user messages when the session surface exceeds the request cap', () => {
    const events = Array.from({ length: 8 }, (_, index) => ({
      type: 'user/message' as const,
      seq: index,
      data: {
        role: 'user',
        content: [{ type: 'text', text: 'x'.repeat(4000) }],
      },
    }))
    const session = mockSession(events)
    const result = enforceSurfaceBudget(session, {
      enabled: true,
      toolResultMaxTokens: 256,
      maxInputTokens: 2000,
    })
    expect(result.count).toBeGreaterThan(0)
    expect(result.plan?.savedTokens).toBeGreaterThan(0)
    expect(session.appended.some((item) => (item as { type: string }).type === 'user/message')).toBe(true)
  })

  it('records the session error when a replace is rejected', () => {
    const events = [toolResultEvent(0, 'x'.repeat(4000))]
    const session = mockSession(events)
    session.append = () => {
      throw new Error('tool/result surface replacement may change only content')
    }
    const result = pruneToolResultsOnSurface(session, 256)
    expect(result.count).toBe(0)
    expect(result.attempts).toBe(1)
    expect(result.lastError).toContain('may change only content')
  })

  it('looks up events by seq when the array is not indexed by seq', () => {
    const event = toolResultEvent(782, 'x'.repeat(4000))
    const session = mockSession([event])
    session.surface = { nodes: [782] }
    const result = pruneToolResultsOnSurface(session, 256)
    expect(result.count).toBe(1)
  })

  it('replaces a prefix of mixed assistant history when the total cap is still exceeded', () => {
    const assistant = (seq: number): SessionEventLike => ({
      type: 'assistant/message',
      seq,
      data: {
        message: {
          role: 'assistant',
          content: [
            { type: 'reasoning', text: 'y'.repeat(4000) },
            { type: 'text', text: 'z'.repeat(4000) },
          ],
        },
      },
    })
    const events: SessionEventLike[] = [
      assistant(0),
      assistant(1),
      {
        type: 'user/message',
        seq: 2,
        data: {
          role: 'user',
          id: 'u1',
          content: [{ type: 'text', text: 'latest' }],
        },
      },
    ]
    const session = mockSession(events)
    const result = enforceSurfaceBudget(session, {
      enabled: true,
      toolResultMaxTokens: 4000,
      maxInputTokens: 100,
    })
    expect(result.count).toBeGreaterThan(0)
    expect(session.appended.some((item) => (item as { type: string }).type === 'compaction/prune')).toBe(true)
    const replace = session.appended.find((item) => (item as { type: string }).type === 'user/message') as
      | { data: { id?: string; content?: Array<{ text?: string }> } }
      | undefined
    expect(replace?.data.id).toMatch(/^dsh-budget-/)
    expect(replace?.data.content?.[0]?.text).toContain('omitted')
  })
})

