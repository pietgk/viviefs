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

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D72]: ../plan/bootstrap/02-decision-log.md#d72
[P12]: ../plan/bootstrap/06-qualification-gates.md#p12
[P13]: ../plan/bootstrap/06-qualification-gates.md#p13
