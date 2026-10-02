# I23: effect-machine still requires the Effect release candidate

Status: ready-for-agent

Category: bug

Found: 2026-10-02

Decide when: the next change that reruns qualification

## What

`@typeonce/effect-machine` 0.38.0, the IntentComposer copy P08 compares, has an exact peer of `effect` 4.0.0-rc.116, so every install since Effect 4.0.0 warns about an unmet peer. P08 passed on 4.0.0 regardless (run `2026-10-02T14-20-51.580Z-2ce3b275`).

0.40.0 (2026-10-02) peers `effect` `^4.0.0`, but 0.39.0 changed the machine API: `Machine.targets(Root)` became dotted state paths and `initialize` replaced root targets. `features/evidence/client/src/intent-composer/effect-machine.ts` uses `Machine.targets`, so the bump is a code change in a qualification input, and P01-P11 go stale again.

Do it with the next change that reruns qualification anyway, and in the same change say "Effect v4" instead of "Effect v4 RC" in P01's name and claim (`tools/qualification/src/gates.ts`, also an input; the name is mirrored in `docs/plan/bootstrap/06-qualification-gates.md`).

## Comments
