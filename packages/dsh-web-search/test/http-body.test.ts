import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import { readHttpJson, requestMethod, type IncomingHttp } from '../src/http-body.ts'

describe('requestMethod', () => {
  it('defaults to GET and uppercases the verb', () => {
    expect(requestMethod({})).toBe('GET')
    expect(requestMethod({ method: 'post' })).toBe('POST')
  })
})

describe('readHttpJson', () => {
  it('uses Request.json when there is no Node stream', async () => {
    const req: IncomingHttp = {
      json: async () => ({ provider: 'tavily' }),
    }
    expect(await readHttpJson(req)).toEqual({ provider: 'tavily' })
  })

  it('returns an empty object when the stream has no body', async () => {
    const req = new EventEmitter() as EventEmitter & IncomingHttp
    const pending = readHttpJson(req)
    req.emit('end')
    expect(await pending).toEqual({})
  })

  it('parses a streamed JSON body', async () => {
    const req = new EventEmitter() as EventEmitter & IncomingHttp
    const pending = readHttpJson(req)
    req.emit('data', Buffer.from('{"provider":'))
    req.emit('data', ' "baidu"}')
    req.emit('end')
    expect(await pending).toEqual({ provider: 'baidu' })
  })

  it('rejects invalid JSON so the probe route can return 400', async () => {
    const req = new EventEmitter() as EventEmitter & IncomingHttp
    const pending = readHttpJson(req)
    req.emit('data', '{')
    req.emit('end')
    await expect(pending).rejects.toBeInstanceOf(SyntaxError)
  })
})
