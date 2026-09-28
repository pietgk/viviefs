import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from '@effect/vitest'
import { motelIngests } from './motel.ts'

// A stand-in for motel: health always answers; ingest either stores the
// span's token or never answers (the daemon seen on 2026-09-28).
const fakeMotel = (ingest: 'stores' | 'hangs') =>
  new Promise<{ server: Server; origin: string }>((resolveServer) => {
    const tokens = new Set<string>()
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost')
      if (url.pathname === '/api/health') {
        response.end(JSON.stringify({ ok: true }))
        return
      }
      if (url.pathname === '/v1/traces') {
        if (ingest === 'hangs') return
        let body = ''
        request.on('data', (chunk: Buffer) => {
          body += chunk.toString()
        })
        request.on('end', () => {
          for (const match of body.matchAll(/"stringValue":"(canary-[^"]+)"/g)) {
            tokens.add(match[1] as string)
          }
          response.end('{}')
        })
        return
      }
      if (url.pathname === '/api/spans/search') {
        const token = url.searchParams.get('attr.probe.token') ?? ''
        response.end(
          JSON.stringify({ data: tokens.has(token) ? [{ span: {} }] : [] }),
        )
        return
      }
      response.statusCode = 404
      response.end()
    })
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolveServer({ server, origin: `http://127.0.0.1:${port}` })
    })
  })

describe('motelIngests', () => {
  let server: Server | undefined
  afterEach(() => {
    server?.closeAllConnections()
    server?.close()
    server = undefined
  })

  it('is true when a posted span can be found', async () => {
    const fake = await fakeMotel('stores')
    server = fake.server
    expect(await motelIngests(fake.origin)).toBe(true)
  })

  it('is false when health answers but ingest hangs', async () => {
    const fake = await fakeMotel('hangs')
    server = fake.server
    expect(await motelIngests(fake.origin)).toBe(false)
  }, 15_000)
})
