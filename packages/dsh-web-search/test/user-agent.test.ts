import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { USER_AGENT } from '../src/user-agent.ts'

describe('USER_AGENT', () => {
  it('matches the package version so a publish bump cannot leave a stale header', () => {
    const pkg = JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
    ) as { version: string }
    expect(USER_AGENT).toBe(`dsh-web-search/${pkg.version}`)
  })
})
