/**
 * What `execute` returns for a run it awaited (I74).
 *
 * A run that suspends reports `Suspended` as its result. When a deferred's
 * completion preempts it (Effect's `deferredDone`, which marks the instance
 * suspended and interrupts the run) after `Workflow.intoResult` has already
 * decided that result, Effect delivers the interrupt at the run's next
 * interruptible step, so the run exits interrupted instead. That depends on
 * scheduling, so the decision lives here, where unit tests cover every case,
 * rather than in the engine, whose coverage comes from the suites.
 */
import * as Cause from 'effect/Cause'
import * as Exit from 'effect/Exit'
import * as Workflow from 'effect/workflow/Workflow'

/** The awaited run's exit, with a preempted suspension read as `Suspended`. */
export const awaitedExit = <A, E>(
  exit: Exit.Exit<A, E>,
  suspended: boolean,
): Exit.Exit<A | Workflow.Suspended, E> =>
  Exit.isFailure(exit) && Cause.hasInterruptsOnly(exit.cause) && suspended
    ? Exit.succeed(new Workflow.Suspended({}))
    : exit
