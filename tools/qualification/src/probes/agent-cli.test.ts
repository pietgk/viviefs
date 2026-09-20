import { describe, expect, it } from '@effect/vitest'
import { parseJsonObject } from './agent-cli.ts'

describe('agent-cli JSON', () => {
  it('parses a lone object', () => {
    expect(parseJsonObject('{"ok":true}')).toEqual({ ok: true })
  })

  it('parses an object after a banner', () => {
    expect(parseJsonObject('progress…\n{"ready":true,"url":"http://127.0.0.1:8081"}\n')).toEqual({
      ready: true,
      url: 'http://127.0.0.1:8081',
    })
  })

  it('fails when stdout has no object', () => {
    expect(() => parseJsonObject('no json here')).toThrow(/no JSON/)
  })
})
