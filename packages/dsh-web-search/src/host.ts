import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type * as Settings from '@deepseek-ai/dsh-settings'
import type * as Web from '@deepseek-ai/dsh-web'
import type SchemaType from '@deepseek-ai/schemastery'

/**
 * Resolve a DSH host package when this plugin is `link:`ed from a checkout.
 * Node ESM then looks next to `lib/index.js`, which is outside the profile
 * and cannot see `@deepseek-ai/dsh-settings` provided by the harness.
 */
export function resolveHostPackage(name: string): string {
  let last: unknown
  for (const anchor of hostAnchors()) {
    try {
      return createRequire(anchor).resolve(name)
    } catch (error) {
      last = error
    }
  }
  throw new Error(
    `[dsh-web-search] cannot resolve ${name} from the plugin, a dsh profile, or the dsh install`,
    { cause: last },
  )
}

function hostAnchors(): string[] {
  const home = homedir()
  const anchors = [
    fileURLToPath(import.meta.url),
    join(home, '.dsh', 'profiles', 'web', 'package.json'),
    join(home, '.dsh', 'profiles', 'desktop', 'package.json'),
    join(home, '.dsh', 'profiles', 'package.json'),
  ]
  if (typeof process.argv[1] === 'string' && process.argv[1].length > 0) {
    anchors.push(process.argv[1])
  }
  const desktopApp = '/Applications/DSH Desktop.app/Contents/Resources/app.asar.unpacked/package.json'
  if (existsSync(desktopApp)) anchors.push(desktopApp)
  return anchors
}

async function loadNamespace(name: string): Promise<Record<string, unknown>> {
  return await import(pathToFileURL(resolveHostPackage(name)).href) as Record<string, unknown>
}

function named<T>(mod: Record<string, unknown>, key: string): T {
  const value = mod[key]
  if (value === undefined) throw new Error(`[dsh-web-search] ${key} is missing from a host package`)
  return value as T
}

const settings = await loadNamespace('@deepseek-ai/dsh-settings')
const web = await loadNamespace('@deepseek-ai/dsh-web')
const schemaMod = await loadNamespace('@deepseek-ai/schemastery')

export const installSettingsSection = named<typeof Settings.installSettingsSection>(
  settings,
  'installSettingsSection',
)
export const settingsNamespace = named<typeof Settings.settingsNamespace>(settings, 'settingsNamespace')
export const WebError = named<typeof Web.WebError>(web, 'WebError')
export const Schema = (schemaMod.default ?? schemaMod) as typeof SchemaType
