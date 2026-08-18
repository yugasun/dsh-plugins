export interface EnvLookup {
  get(name: string): string
}

export function processEnvLookup(): EnvLookup {
  return {
    get(name: string): string {
      const value = process.env[name]
      return value == null ? '' : value
    },
  }
}

export function launchEnvLookup(ctx: { get(name: string): unknown }): EnvLookup {
  return {
    get(name: string): string {
      const launch = ctx.get('launchEnvironment') as
        | { get?(key: string): { value?: string } | undefined }
        | undefined
      const fromLaunch = launch?.get?.(name)?.value
      if (fromLaunch != null && fromLaunch.length > 0) return fromLaunch
      return processEnvLookup().get(name)
    },
  }
}

export function firstEnv(env: EnvLookup, names: readonly string[]): string {
  for (const name of names) {
    const value = env.get(name).trim()
    if (value.length > 0) return value
  }
  return ''
}
