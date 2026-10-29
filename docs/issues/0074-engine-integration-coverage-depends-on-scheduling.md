# I74: The engine's integration coverage depends on scheduling

Status: resolved

Category: bug

Found: 2026-10-16

## What

`verify`'s `evidence` step sometimes fails with "coverage regressed" for
`libs/workflow-engine/src/engine.ts` (integration), because whether the
crash-matrix suite reaches one branch of `execute` depends on fiber scheduling.

Observed on a Linux arm64 cloud sandbox, full `pnpm verify`, no change to the
engine:

```text
libs/workflow-engine/src/engine.ts (integration): coverage regressed. Lockfile
statements 267/294, branches 123/156, functions 54/57, lines 247/262; now
statements 266/294, branches 120/156, functions 54/57, lines 246/262.
```

Three more `pnpm verify unit integration storybook evidence` runs did not show
it. In six `pnpm verify integration` runs, one had a different uncovered set for
`engine.ts`: branches at lines 524, 526 and 527 and the statement at line 529.
That is the `execute` path where it awaits a running workflow fiber that ends
interrupted while suspended, and returns `Suspended`.

Temporary tracing (since reverted) showed that only `CrashMatrix.v1` takes that
path, 0, 3 or 4 times per run of the package's integration config. The other
times `execute` finds the fiber already finished, or the fiber ends some other
way. Both results are correct; only the coverage changes.

Fix candidates, for the human to pick:

- A focused test that always reaches that branch: `execute` on a workflow that
  is still running when `execute` reads `runs`, and then suspends on a
  `DurableDeferred`. That leaves the [P06 Workflow engine crash matrix][P06] suite's checks untouched.
- Or make the crash-matrix step that reaches it deterministic (a latch rather
  than timing). That changes a gate suite, so it needs the gate's agreement.

Running `pnpm verify baseline` to record the lower number would loosen the gate
and is not a fix. Recording a baseline in that sandbox also hit
[I72 verify baseline fails in a fresh worktree][I72]: Nx restored the
`evidence-mobile` build from its cache without the bundle report, and an
uncached build could not run there because `hermesc` has no linux-arm64 binary.

## Comments

2026-10-20: It now blocks recording a baseline. On the Linux arm64 sandbox, on
Effect 4.0.2, `pnpm verify baseline` refused once ("coverage differs between
runs, a flaky test to fix first") and the next attempt had all three runs low,
so it wrote `engine.ts` at 120/156 branches. That lower number was discarded,
not committed. CI (x86-64) still matches the lockfile's 123/156.

A focused test does not reach the branch the simple way: Effect's workflow
wrapper turns a self-suspension (`DurableDeferred.await`) into a successful
`Suspended` result, so `execute` takes `return (yield* exit)`. The branch
needs the awaited fiber to fail with interrupts only while suspended, which
some other interrupt must cause. In the same attempt, `execute` (not discard)
on a workflow waiting on a deferred that is never completed did not return
within 8 seconds, on sqlite-node; whether that is intended is a question for
the engine's contract.

2026-10-21: Resolved by moving the decision into a unit-tested function
(`awaitedExit` in `libs/workflow-engine/src/awaited.ts`, pietgk/viviefs PR 4).
Tracing found the race: only the lease-handoff check reached the branch. Its
durable clock fires while `execute` retries the suspended run every 20 ms, and
when Effect's `deferredDone` preempts a run after `Workflow.intoResult` has
decided `Suspended`, the interrupt lands at the run's next interruptible step,
so the run exits interrupted. Effect 4 reports that exit even for an
uninterruptible run, so the handling stays; only where it is tested changes.
`engine.ts` was the same in 8 of 8 integration runs, and `verify all` went
green on the arm64 sandbox. The first candidate above was tried and dropped:
a self-suspending workflow never reaches the branch.

2026-10-22: Back on Effect 4.0.5, in a second place. Once a repeated deferred completion stopped waking the run (the replay loop on PGlite, see [ADR-0003 Effect v4 as the backbone][ADR-0003]), `resume`'s early return for a run that already has its result (and the stored-result decode before it) was reached only when a queued wake happened to land after the run finished: 2 of 6 integration runs missed it. `engine.integration.test.ts` now reaches it on purpose: a finished run is completed again and resumed, and its body must not run again (it fails if `resume` replays a finished run). `engine.ts`'s uncovered set was identical in 8 of 8 integration runs after that.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0003]: ../adr/0003-effect-v4-as-backbone.md
[I72]: 0072-verify-baseline-fails-in-a-fresh-worktree.md
[P06]: ../plan/bootstrap/06-qualification-gates.md#p06
