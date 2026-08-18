import Schema from '@deepseek-ai/schemastery'

export const SETTINGS_NS = 'dsh-budget'

export interface Config {
  enabled: boolean
  toolResultMaxTokens: number
  failOpen: boolean
}

export const Config: Schema<Config> = Schema.object({
  enabled: Schema.boolean().default(true).description('Master switch. Off sends tool results verbatim.'),
  toolResultMaxTokens: Schema.number().min(256).default(4000).description('Cap for one tool result. Oversized dumps keep a head/tail preview; the full text is stored aside.'),
  failOpen: Schema.boolean().default(true).hidden(),
})

export const DEFAULT_CONFIG: Config = {
  enabled: true,
  toolResultMaxTokens: 4000,
  failOpen: true,
}
