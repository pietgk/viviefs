# ADR-0004: Expo SDK 58 and Hermes platform baseline

Summary: Expo SDK 58 on React Native 0.88 and Hermes from day one, pinned, with the polyfills the platform needs.

Status: Qualified

Date: 2026-09-20. Amended 2026-10-22 (SDK 58 stable: the pin moved off the beta).

Qualifying gate: [P01 Platform on SDK 58][P01]

Related: [D22 Expo SDK 58][D22]. [research/02](../plan/bootstrap/research/02-effect-v4-react-native.md),
[research/05](../plan/bootstrap/research/05-related-work-and-inputs.md),
[ADR 0003](0003-effect-v4-as-backbone.md).

## Design

Expo SDK 58 (RN 0.88) from day one. Pin the beta; move to stable when it lands
(expected October 2026). Rerun the RN compatibility research on SDK 58 first.

Known work from SDK 56 that [P01 Platform on SDK 58][P01] must re-measure:

- `crypto.getRandomValues` and `crypto.subtle.digest` polyfills (expo-crypto or
  react-native-quick-crypto). Hermes has neither; Workflow hashes ids with
  `subtle.digest`.
- Metro rejects the dynamic `import()` in `effect/sql/Migrator.js`
  (Effect-TS/effect#6347). The babel stub in `docs/plan/bootstrap/research/rn-check/babel.config.js`
  is the workaround until upstream lands.
- Prefer deep imports (`effect/Effect`) or Expo tree shaking: the barrel added
  about 2.7 MB to an iOS bundle on SDK 56.
- Record what "iOS 27 required" means (deployment target vs build SDK).

iOS, Android and web are first-class. [P01 Platform on SDK 58][P01] fails if the Android emulator fails.

## Trade-offs

SDK 58 is beta. Pinning it avoids a migration from 56/57 for nothing. The cost
is instability until stable lands. Skipping Android to make iOS pass is
forbidden.

## Failure-handling

[P01 Platform on SDK 58][P01] pass condition: the research/02 probe (15 checks including Workflow +
Activity on the memory workflow engine) on a real iOS simulator and a real Android
emulator with real polyfills; a bundle importing `effect/sql` builds
with the Migrator babel workaround; JS bundle-size baseline recorded. Positive
control: without the crypto polyfill the workflow check fails.

## Outcome

### Expected

SDK 58 is the only Expo line. Polyfills and the Migrator workaround are
measured, not assumed from SDK 56.

### Observed

2026-09-20. Ledger pass `2026-09-20T13-34-27.833Z-a195ecaf` (dirty tree,
commit `aa5e3dd4`). Polyfill is `expo-crypto` on `globalThis.crypto`. iOS
export with the Migrator SQL import built (3653396 bytes). Baseline bundle,
no SQL import, was 3389852 bytes. "iOS 27" means the build SDK, not the
minimum deployment target: this run used Xcode 26.6 and an iOS 26.5
simulator. Evidence: [2026-09-20-p01.md](../evidence/2026-09-20-p01.md).
Qualified 2026-09-22 from that record. Not Accepted.

2026-10-22: SDK 58 stable (released 2026-10-15). `expo` 58.0.17,
`react-native` 0.88.0, `react` and `react-dom` 19.3.0, and every Expo module at
the version `expo` 58.0.17 bundles; `npx expo install --check` and expo-doctor
are clean. Doctor's findings were fixed: `newArchEnabled` left `app.json` (the
schema rejects it; the New Architecture is the only one), Metro's
`unstable_enableSymlinks` left `metro.config.js` (Metro 0.87 no longer reads
it), and the workspace root pins `@babel/core` 7.29.7 so op-sqlite and
React Native resolve to one copy each. A fresh development build on both
devices: `expo prebuild --clean` now writes `SceneDelegate.swift` and the scene
manifest (the iOS 27 life cycle), built with Xcode 26.6 for the iOS 26.5
simulator, so building SDK 58 still does not need Xcode 27. The first
sequential run failed [P11 Identity][P11] on iOS only: the app presented Keycloak's sheet, and
agent-device could not read it; [P11][P11] then passed alone, and
[P01 Platform on SDK 58][P01]-[P11][P11] passed in one sequential run on `2a56b18c0`, run `2026-10-22T15-07-32.252Z-5378fb60`.
The same failure came back after the audit fixes: agent-device 0.21.6 refused
every snapshot of the sheet ("requires a valid viewport"), a runner bug fixed
upstream, so the lab moved to agent-device 0.21.30 (callstack/agent-device#2938). [P01][P01]-[P11][P11] then passed in one sequential run on `3a5dc1a57`,
run `2026-10-22T19-57-19.763Z-1f994378`, and [P11][P11] passed alone twice more on it.
The Hermes bundles grew by about 170 KB (iOS 5.52 MB, Android 7.63 MB): Effect
4.0.5, React Native 0.88.0, and development tooling Expo 58 now ships in a
production export ([I75 Expo 58's production bundle carries its development tooling][I75]).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D22]: ../plan/bootstrap/02-decision-log.md#d22
[I75]: ../issues/0075-expo-58-production-bundle-carries-dev-tooling.md
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
