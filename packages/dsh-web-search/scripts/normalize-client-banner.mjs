#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'client')
const cjs = path.join(dir, 'client.cjs')
const js = path.join(dir, 'client.js')
const source = fs.existsSync(cjs) ? cjs : js

if (!fs.existsSync(source)) {
  console.error(`normalize-client-banner: missing ${cjs} or ${js}`)
  process.exit(1)
}

/**
 * DSH keys the client module table on the Cordis loader entry `name`
 * (the npm specifier in cordis.patch.yml), which must match package.json
 * `name`. Keep `export const name` / patch `id` unscoped for settings.yaml.
 */
function loaderEntryName() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  if (typeof pkg.name !== 'string' || pkg.name.length === 0) {
    console.error('normalize-client-banner: package.json is missing name')
    process.exit(1)
  }
  return pkg.name
}

const idJson = JSON.stringify(loaderEntryName())
let body = fs.readFileSync(source, 'utf8')
body = body.replaceAll('sourceMappingURL=client.cjs.map', 'sourceMappingURL=client.js.map')

if (!body.includes('window.__ModuleLoader__')) {
  const wrapped = [
    `window.__ModuleLoader__.load({ id: ${idJson}, factory: (require) => {`,
    '\tvar module = { exports: {} };',
    '\tvar exports = module.exports;',
    body,
    '\treturn module.exports;',
    '}',
    '});',
    '',
  ].join('\n')
  fs.writeFileSync(js, wrapped)
} else if (source !== js) {
  fs.writeFileSync(js, body)
}

const mapSrc = `${source}.map`
const mapDst = `${js}.map`
if (fs.existsSync(mapSrc) && mapSrc !== mapDst) fs.renameSync(mapSrc, mapDst)
if (source !== js && fs.existsSync(source)) fs.unlinkSync(source)
console.log(`normalize-client-banner ok: ${js} id=${JSON.parse(idJson)}`)
