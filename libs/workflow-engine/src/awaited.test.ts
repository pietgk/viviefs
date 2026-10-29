// What execute returns for a run it awaited (I74): a suspension preempted by a
// durable deferred's completion reads as Suspended; every other exit is the run's own.
import { describe, expect, it } from '@effect/vitest'
import * as Cause from 'effect/Cause'
import * as Exit from 'effect/Exit'
import * as Workflow from 'effect/workflow/Workflow'
import { awaitedExit } from './awaited.ts'

const interrupted = Exit.failCause(Cause.interrupt(1))

describe('awaitedExit', () => {
  it('reads an interrupt-only exit of a suspended instance as Suspended', () => {
    const exit = awaitedExit(interrupted, true)
    expect(Exit.isSuccess(exit) && exit.value).toBeInstanceOf(Workflow.Suspended)
  })

  it('keeps an interrupt when the instance did not suspend', () => {
    expect(awaitedExit(interrupted, false)).toBe(interrupted)
  })

  it('keeps a failure that is not only interrupts, suspended or not', () => {
    const died = Exit.die('boom')
    expect(awaitedExit(died, true)).toBe(died)
    const mixed = Exit.failCause(Cause.combine(Cause.interrupt(1), Cause.fail('typed')))
    expect(awaitedExit(mixed, true)).toBe(mixed)
  })

  it("keeps a run's own result", () => {
    const suspended = Exit.succeed(new Workflow.Suspended({}))
    expect(awaitedExit(suspended, true)).toBe(suspended)
    const value = Exit.succeed('done')
    expect(awaitedExit(value, false)).toBe(value)
  })
})
