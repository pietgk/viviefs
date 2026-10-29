# I23: effect-machine still requires the Effect release candidate

Status: resolved

Category: bug

Found: 2026-10-02

Decide when: the next change that reruns qualification

## What

`@typeonce/effect-machine` 0.38.0, the IntentComposer copy [P08 UI three-way prototype][P08] compares, has an exact peer of `effect` 4.0.0-rc.116, so every install since Effect 4.0.0 warns about an unmet peer. [P08][P08] passed on 4.0.0 regardless (run `2026-10-02T14-20-51.580Z-2ce3b275`).

0.40.0 (2026-10-02) peers `effect` `^4.0.0`, but 0.39.0 changed the machine API: `Machine.targets(Root)` became dotted state paths and `initialize` replaced root targets. `features/evidence/client/src/intent-composer/effect-machine.ts` uses `Machine.targets`, so the bump is a code change in a qualification input, and [P01 Platform on SDK 58][P01]-[P11 Identity][P11] go stale again.

Do it with the next change that reruns qualification anyway, and in the same change say "Effect v4" instead of "Effect v4 RC" in [P01 Platform on SDK 58][P01]'s name and claim (`tools/qualification/src/gates.ts`, also an input; the name is mirrored in `docs/plan/bootstrap/06-qualification-gates.md`).

## Comments

2026-10-09: Unchanged with Effect 4.0.2: `@typeonce/effect-machine` 0.40.0 is still the newest and peers `effect` ^4.0.0, so the bump to it is still a code change (`Machine.targets` became dotted state paths in 0.39.0), batched with the next qualification run.

2026-10-22: Not in the Effect 4.0.5 and Expo SDK 58 stable change, although that change reran qualification: it was scoped to the platform repin and the workflow engine fix. `@typeonce/effect-machine` 0.41.1 is now the newest and peers `effect` ^4.0.0; 0.38.0 still peers the release candidate exactly (the `pnpm peers check` warning remains). Still for the next qualification run.

2026-10-29: Pinned `@typeonce/effect-machine` 0.46.0, the current stable
release (MIT), whose Effect peer is `^4.0.0`. The composer uses the typed state
paths from `intentComposerGraph` directly instead of the removed
`Machine.targets` helper. The existing contract and screen tests reproduced
`Machine.targets is not a function` after the package bump and pass after the
API change. A contract test for each retained driver explicitly waits through
composing for reviewing; that wait branch was previously reached incidentally
by the older runtime's notifications. The reviewed coverage baseline removes
only the deleted target helper's counts, with no additional uncovered code.

The other install warning came from `effect-solutions`: its isolated Effect
beta.59 had resolved `@effect/platform-node-shared` rc.116 through
`@effect/platform-bun`'s range. A scoped override pins that dependency to
beta.59. `pnpm peers check` now reports no peer dependency issues, and
`pnpm exec effect-solutions list` still runs.

The current [P01 Platform on SDK 58][P01] claim and summary now say Effect v4;
the gate's name already omitted RC. Its matching plan text follows it;
historical records and the machine-written ledger retain their original text.
Validation: `mise exec -- pnpm verify baseline` and `mise exec -- pnpm verify`.
Qualification remains stale until the batch's sequential run on a committed tree.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P08]: ../plan/bootstrap/06-qualification-gates.md#p08
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
