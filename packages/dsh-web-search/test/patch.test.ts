import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Same rules as dshmarket `parseSimplePatch`: hot-mount accepts only
 * comment/blank lines, `- insert:`, then `id` / `name` pairs. Any config,
 * disable, or expression row returns null and the market asks for a restart.
 */
function parseSimplePatch(patchText: string): Array<{ id: string; name: string }> | null {
  const rows: Array<{ id: string; name: string }> = []
  let pending: string | null = null
  for (const raw of patchText.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trimEnd()
    if (line.trim() === '') continue
    if (/^-\s+insert:\s*$/.test(line)) continue
    const id = /^\s+-\s+id:\s*(\S+)\s*$/.exec(line)
    if (id !== null) {
      if (pending !== null) return null
      pending = id[1]
      continue
    }
    const name = /^\s+name:\s*['"]?([^'"\s]+)['"]?\s*$/.exec(line)
    if (name !== null && pending !== null) {
      rows.push({ id: pending, name: name[1] })
      pending = null
      continue
    }
    return null
  }
  if (pending !== null || rows.length === 0) return null
  return rows
}

describe('cordis.patch.yml', () => {
  it('is a plain insert so dshmarket can hot-mount without a restart', () => {
    const patch = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '..', 'cordis.patch.yml'),
      'utf8',
    )
    expect(parseSimplePatch(patch)).toEqual([
      { id: 'dsh-web-search', name: '@yugasun/dsh-web-search' },
    ])
  })
})
