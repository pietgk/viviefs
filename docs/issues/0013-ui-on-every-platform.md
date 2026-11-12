# I13: UI renders only in the DOM, never on a device

Status: ready-for-agent

Category: bug

Effort: App shell ([P12 UI on every platform][P12], [P13 Links and routing][P13])

Decide when: the App shell step of Docs and teaching

## What

IntentComposer renders DOM through `react-dom`, and no story runs in a browser or on a device: the `storybook` step is Vitest with jsdom ([D72 UI on every platform][D72]).

## Direction

One React Native component tree; stories in Chromium in `verify` and on the simulators in [P12 UI on every platform][P12].

## Comments

2026-11-10: From [I100 Address the repo-wide review findings][I100]'s triage, design concern A02 of the [2026-10-29 repo-wide review](../research/2026-10-29-repo-wide-review.md#a02-interaction-sessions-have-no-owned-shutdown) lands here, since the app shell is where the retained driver is copied into screens that live long. What it adds: an IntentComposer session (`features/evidence/client/src/intent-composer/driver.ts`) offers snapshot, send and subscribe and no way to end it; the effect-machine driver opens a Scope nothing closes, and the XState and Atom drivers leave out `actor.stop` and `registry.dispose` in the same way. Required before the driver is copied into the app shell: the actor and its changes stream belong to an owner Scope, or the session has a dispose operation, with a check that teardown releases them. Keep the lifetime of an accepted durable command apart from the screen's: a submit may finish after the person left the screen, and the abandoned session still has to end.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D72]: ../plan/bootstrap/02-decision-log.md#d72
[I100]: 0100-address-the-repo-wide-review-findings.md
[P12]: ../plan/bootstrap/06-qualification-gates.md#p12
[P13]: ../plan/bootstrap/06-qualification-gates.md#p13
