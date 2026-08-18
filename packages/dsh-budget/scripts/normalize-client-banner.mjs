#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const name = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).name
const idJson = JSON.stringify(name)
const dir = path.join(root, 'client')
const cjs = path.join(dir, 'client.cjs')
const js = path.join(dir, 'client.js')
const source = fs.existsSync(cjs) ? cjs : js

if (!fs.existsSync(source)) {
  console.error(`normalize-client-banner: missing ${cjs} or ${js}`)
  process.exit(1)
}

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
console.log(`normalize-client-banner ok: ${js}`)
