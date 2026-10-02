# I13: UI renders only in the DOM, never on a device

Status: ready-for-agent

Category: bug

Effort: App shell (P12, P13)

Decide when: the App shell step of Docs and teaching

## What

IntentComposer renders DOM through `react-dom`, and no story runs in a browser or on a device: the `storybook` step is Vitest with jsdom (D72).

## Direction

One React Native component tree; stories in Chromium in `verify` and on the simulators in P12.

## Comments
