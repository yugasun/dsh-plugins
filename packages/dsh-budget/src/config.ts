import Schema from '@deepseek-ai/schemastery'

export const SETTINGS_NS = 'dsh-budget'

export interface Config {
  enabled: boolean
  maxInputTokens: number
  toolResultMaxTokens: number
  failOpen: boolean
}

export const Config: Schema<Config> = Schema.object({
  enabled: Schema.boolean().default(true).description('Master switch. Off sends tool results and history verbatim.'),
  toolResultMaxTokens: Schema.number().min(256).default(4000).description('Cap for one tool result. Oversized dumps keep a head/tail preview.'),
  maxInputTokens: Schema.number().min(1024).default(64_000).description('Cap for tool results plus this step’s history. System prompt and tool schemas are not included and are not trimmed.'),
  failOpen: Schema.boolean().default(true).hidden(),
})

export const DEFAULT_CONFIG: Config = {
  enabled: true,
  maxInputTokens: 64_000,
  toolResultMaxTokens: 4000,
  failOpen: true,
}
