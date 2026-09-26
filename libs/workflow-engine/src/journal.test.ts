import { describe, expect, it } from '@effect/vitest'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import {
  decodeActivityStarted,
  decodeClock,
  decodeExit,
  decodeLease,
  decodeStarted,
  decodeWorkflowExit,
  encodeActivityStarted,
  encodeClock,
  encodeExit,
  encodeLease,
  encodeStarted,
  encodeWorkflowExit,
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

  it('round-trips the activity start fact and rejects other shapes', () => {
    const started = encodeActivityStarted({ name: 'step-one', attempt: 2 })
    expect(decodeActivityStarted(started)).toEqual({
      name: 'step-one',
      attempt: 2,
    })
    expect(decodeActivityStarted('{"name":"step-one"}')).toBeNull()
  })

})

class Refused extends Schema.TaggedError<Refused>()('Refused', { by: Schema.String }) {}

describe('journaled exits keep their whole cause', () => {
  it('round-trips a typed failure, a defect and an interruption', () => {
    const failed = decodeExit(encodeExit(Exit.fail({ _tag: 'Refused', by: 'a' })))
    expect(failed && Exit.isFailure(failed) ? Cause.findErrorOption(failed.cause) : undefined).toEqual(
      Option.some({ _tag: 'Refused', by: 'a' }),
    )
    const died = decodeExit(encodeExit(Exit.die(new Error('boom'))))
    expect(died && Exit.isFailure(died) && Cause.hasDies(died.cause)).toBe(true)
    expect(died && Exit.isFailure(died) && Cause.hasFails(died.cause)).toBe(false)
    const interrupted = decodeExit(encodeExit(Exit.interrupt(1)))
    expect(interrupted && Exit.isFailure(interrupted) && Cause.hasInterruptsOnly(interrupted.cause)).toBe(true)
  })

  it('still reads the legacy failure shape', () => {
    const legacy = decodeExit('{"_tag":"Failure","error":"Cause([Fail(\\"x\\")])"}')
    expect(legacy && Exit.isFailure(legacy) ? Cause.findErrorOption(legacy.cause) : undefined).toEqual(
      Option.some('Cause([Fail("x")])'),
    )
    expect(decodeExit('{"_tag":"Success","value":"ok"}')).toEqual(Exit.succeed('ok'))
    expect(decodeExit('not json')).toBeNull()
  })

  it.effect('encodes a workflow result with the workflow schemas', () =>
    Effect.gen(function* () {
      const workflow = { successSchema: Schema.String, errorSchema: Refused }
      const value = yield* encodeWorkflowExit(workflow, Exit.fail(new Refused({ by: 'reviewer' })))
      const exit = yield* decodeWorkflowExit(workflow, value)
      const error = exit && Exit.isFailure(exit) ? Cause.findErrorOption(exit.cause) : Option.none()
      expect(Option.isSome(error) && error.value instanceof Refused).toBe(true)
      expect(decodeExit(value)?._tag).toBe('Failure')
      const ok = yield* decodeWorkflowExit(workflow, yield* encodeWorkflowExit(workflow, Exit.succeed('done')))
      expect(ok).toEqual(Exit.succeed('done'))
    }),
  )
})
