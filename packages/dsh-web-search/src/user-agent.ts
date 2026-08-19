import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

function packageVersion(): string {
  const dir = dirname(fileURLToPath(import.meta.url))
  try {
    const pkg = JSON.parse(readFileSync(join(dir, '..', 'package.json'), 'utf8')) as { version?: unknown }
    if (typeof pkg.version === 'string' && pkg.version.length > 0) return pkg.version
  } catch {
    // Built or test layouts that cannot see package.json keep a placeholder.
  }
  return '0.0.0'
}

export const USER_AGENT = `dsh-web-search/${packageVersion()}`
