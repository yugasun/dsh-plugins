import { estimateTokens } from './estimate.ts'
import type { BudgetCaps, RequestPlan } from './planner.ts'
import { budgetToolTextWithNotice } from './tool-result.ts'

export const FIXTURE_NAME = 'bash-dump'
export const FIXTURE_TOOL = 'bash'
export const FIXTURE_SOURCE_TOKENS = 40_000

const LINE =
  '2026-08-18T03:00:00Z INFO job=build step=compile file=src/index.ts message=ok hash=0123456789abcdef\n'

export interface SessionLogEvent {
  seq: number
  type: string
  data: Record<string, unknown>
}

export interface LogArm {
  label: 'control' | 'treatment'
  events: number
  bytes: number
  tokens: number
  preview: string
}

export interface EventDiff {
  seq: number
  type: string
  controlTokens: number
  treatmentTokens: number
  savedTokens: number
}

export interface SessionLogExperiment {
  fixture: {
    name: string
    tool: string
    sourceTokens: number
    sourceChars: number
  }
  caps: Pick<BudgetCaps, 'maxInputTokens' | 'toolResultMaxTokens'>
  control: LogArm
  treatment: LogArm
  plan: RequestPlan
  savedTokens: number
  savedBytes: number
  savedPercent: number
  diffs: EventDiff[]
}

let dumpCache: string | undefined

export function fixtureDump(minTokens = FIXTURE_SOURCE_TOKENS): string {
  if (dumpCache && minTokens === FIXTURE_SOURCE_TOKENS) return dumpCache
  const needChars = minTokens * 4
  const n = Math.ceil(needChars / LINE.length)
  const dump = LINE.repeat(n)
  if (minTokens === FIXTURE_SOURCE_TOKENS) dumpCache = dump
  return dump
}

function flattenContent(value: unknown): string {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''
  let text = ''
  for (const block of value) {
    if (block && typeof block === 'object' && 'text' in block && typeof block.text === 'string') {
      text += block.text
    }
  }
  return text
}

function eventText(event: SessionLogEvent): string {
  const data = event.data
  if (event.type === 'user/message') return flattenContent(data.content)
  if (event.type === 'assistant/message') {
    const message = data.message as { content?: unknown } | undefined
    return flattenContent(message?.content)
  }
  if (event.type === 'tool/result') {
    const message = data.message as { content?: unknown } | undefined
    return flattenContent(message?.content)
  }
  if (event.type === 'tool/call') {
    return typeof data.arguments === 'string' ? data.arguments : ''
  }
  return ''
}

function previewText(text: string, max = 280): string {
  if (text.length <= max) return text
  const head = Math.ceil((max - 17) / 2)
  const tail = Math.floor((max - 17) / 2)
  return `${text.slice(0, head)}\n…[omitted]…\n${text.slice(-tail)}`
}

function encodeJsonl(events: readonly SessionLogEvent[]): string {
  return `${events.map((event) => JSON.stringify(event)).join('\n')}\n`
}

function arm(label: LogArm['label'], events: SessionLogEvent[]): LogArm {
  const jsonl = encodeJsonl(events)
  const tool = events.find((event) => event.type === 'tool/result')
  return {
    label,
    events: events.length,
    bytes: new TextEncoder().encode(jsonl).length,
    tokens: events.reduce((sum, event) => sum + estimateTokens(eventText(event)), 0),
    preview: previewText(tool ? eventText(tool) : ''),
  }
}

function buildTurn(toolText: string): SessionLogEvent[] {
  return [
    { seq: 1, type: 'turn/start', data: { turn: 1 } },
    { seq: 2, type: 'step/start', data: { turn: 1, step: 1 } },
    {
      seq: 3,
      type: 'user/message',
      data: {
        role: 'user',
        content: [{ type: 'text', text: 'Summarize the latest build log.' }],
      },
    },
    {
      seq: 4,
      type: 'assistant/message',
      data: {
        turn: 1,
        step: 1,
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Reading the build output.' }],
        },
      },
    },
    {
      seq: 5,
      type: 'tool/call',
      data: {
        turn: 1,
        step: 1,
        callId: 'call_bash_1',
        name: FIXTURE_TOOL,
        arguments: '{"command":"cat /tmp/build.log"}',
      },
    },
    {
      seq: 6,
      type: 'tool/result',
      data: {
        turn: 1,
        step: 1,
        message: {
          role: 'tool',
          content: [{ type: 'text', text: toolText }],
        },
      },
    },
    {
      seq: 7,
      type: 'assistant/message',
      data: {
        turn: 1,
        step: 1,
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Build finished with no errors.' }],
        },
      },
    },
    { seq: 8, type: 'step/end', data: { turn: 1, step: 1 } },
    { seq: 9, type: 'turn/end', data: { turn: 1, reason: 'success' } },
  ]
}

function replaceToolResult(events: SessionLogEvent[], text: string): SessionLogEvent[] {
  return events.map((event) => {
    if (event.type !== 'tool/result') return event
    return {
      ...event,
      data: {
        ...event.data,
        message: {
          role: 'tool',
          content: [{ type: 'text', text }],
        },
      },
    }
  })
}

/**
 * Same fixture turn, two session-log JSONL arms: budget off vs on.
 * The treatment arm is what `tools/post-execute` would persist as `tool/result`.
 */
export function runSessionLogExperiment(caps: BudgetCaps): SessionLogExperiment {
  const source = fixtureDump()
  const controlEvents = buildTurn(source)
  const trimmed = budgetToolTextWithNotice(
    source,
    { ...caps, enabled: true },
    `tool-result:${FIXTURE_TOOL}`,
    `spill://fixture/${FIXTURE_TOOL}.txt`,
    'Retrieve with spill.',
  )
  const treatmentEvents = replaceToolResult(controlEvents, trimmed.next)
  const control = arm('control', controlEvents)
  const treatment = arm('treatment', treatmentEvents)
  const diffs = controlEvents
    .map((event, index) => {
      const other = treatmentEvents[index]
      if (!other) return null
      const controlTokens = estimateTokens(eventText(event))
      const treatmentTokens = estimateTokens(eventText(other))
      if (controlTokens === treatmentTokens) return null
      return {
        seq: event.seq,
        type: event.type,
        controlTokens,
        treatmentTokens,
        savedTokens: Math.max(0, controlTokens - treatmentTokens),
      }
    })
    .filter((row): row is EventDiff => row !== null)

  const savedTokens = Math.max(0, control.tokens - treatment.tokens)
  const savedBytes = Math.max(0, control.bytes - treatment.bytes)
  return {
    fixture: {
      name: FIXTURE_NAME,
      tool: FIXTURE_TOOL,
      sourceTokens: estimateTokens(source),
      sourceChars: source.length,
    },
    caps: {
      maxInputTokens: caps.maxInputTokens,
      toolResultMaxTokens: caps.toolResultMaxTokens,
    },
    control,
    treatment,
    plan: trimmed.plan,
    savedTokens,
    savedBytes,
    savedPercent: control.tokens === 0 ? 0 : Math.round((savedTokens / control.tokens) * 100),
    diffs,
  }
}
