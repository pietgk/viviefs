import { describe, expect, it } from '@effect/vitest'
import { startReportServer } from './report-server.ts'

describe('qualification report server', () => {
  it('accepts a probe report and returns it to waitFor', async () => {
    const server = await startReportServer('127.0.0.1')
    try {
      const waiting = server.waitFor({
        gate: 'P01',
        platform: 'ios',
        variant: 'polyfill',
      })
      const payload = {
        gate: 'P01',
        platform: 'ios',
        variant: 'polyfill',
        checks: [{ name: 'workflow memory', status: 'PASS', detail: '"BOB"' }],
        globals: { TextDecoder: 'function' },
      }
      const response = await fetch(`${server.url}/report`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(response.ok).toBe(true)
      await expect(waiting).resolves.toEqual(payload)
    } finally {
      await server.close()
    }
  })

  it('rejects an unknown path without hanging', async () => {
    const server = await startReportServer('127.0.0.1')
    try {
      const response = await fetch(`${server.url}/nope`)
      expect(response.status).toBe(404)
    } finally {
      await server.close()
    }
  })
})
