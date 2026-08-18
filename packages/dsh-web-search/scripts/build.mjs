#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(new URL('.', import.meta.url)))
const tsdown = path.join(root, 'node_modules', '.bin', 'tsdown')

function run(args) {
  const result = spawnSync(tsdown, args, { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(['-c', 'tsdown.config.ts'])
run(['-c', 'tsdown.client.ts'])

const banner = spawnSync(process.execPath, ['scripts/normalize-client-banner.mjs'], {
  cwd: root,
  stdio: 'inherit',
})
if (banner.status !== 0) process.exit(banner.status ?? 1)
