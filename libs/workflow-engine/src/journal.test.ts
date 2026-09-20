import { describe, expect, it } from '@effect/vitest'
import * as Exit from 'effect/Exit'
import {
  decodeClock,
  decodeExit,
  decodeLease,
  decodeStarted,
  encodeClock,
  encodeExit,
  encodeLease,
  encodeStarted,
} from './journal.ts'

describe('engine journal encoding', () => {
  it('round-trips started, lease, clock and exit values', () => {
    const started = encodeStarted({ name: 'CrashMatrix.v1', payload: { n: 1 } })
    expect(decodeStarted(started)).toEqual({
      name: 'CrashMatrix.v1',
      payload: { n: 1 },
    })
    const lease = encodeLease({
      device: 'a',
      epoch: 2,
      expiresAtMs: null,
    })
    expect(decodeLease(lease)).toEqual({
      device: 'a',
      epoch: 2,
      expiresAtMs: null,
    })
    const clock = encodeClock({
      workflowName: 'CrashMatrix.v1',
      name: 'wait',
      deferredName: 'DurableClock/wait',
      wakeAtMs: 120_000,
    })
    expect(decodeClock(clock)?.wakeAtMs).toBe(120_000)
    expect(decodeExit(encodeExit(Exit.succeed('ok')))).toEqual(Exit.succeed('ok'))
    expect(decodeExit(encodeExit(Exit.fail('no')))?._tag).toBe('Failure')
  })
})
