# ADR-0004: Expo SDK 58 and Hermes platform baseline

Status: Qualified

Date: 2026-09-20

Qualifying gate: P01

Related: D22. [research/02](../plan/bootstrap/research/02-effect-v4-react-native.md),
[research/05](../plan/bootstrap/research/05-related-work-and-inputs.md),
[ADR 0003](0003-effect-v4-as-backbone.md).

## Design

Expo SDK 58 (RN 0.88) from day one. Pin the beta; move to stable when it lands
(expected October 2026). Rerun the RN compatibility research on SDK 58 first.

Known work from SDK 56 that P01 must re-measure:

- `crypto.getRandomValues` and `crypto.subtle.digest` polyfills (expo-crypto or
  react-native-quick-crypto). Hermes has neither; Workflow hashes ids with
  `subtle.digest`.
- Metro rejects the dynamic `import()` in `effect/unstable/sql/Migrator.js`
  (Effect-TS/effect#6347). The babel stub in `docs/plan/bootstrap/research/rn-check/babel.config.js`
  is the workaround until upstream lands.
- Prefer deep imports (`effect/Effect`) or Expo tree shaking: the barrel added
  about 2.7 MB to an iOS bundle on SDK 56.
- Record what "iOS 27 required" means (deployment target vs build SDK).

iOS, Android and web are first-class. P01 fails if the Android emulator fails.

## Trade-offs

SDK 58 is beta. Pinning it avoids a migration from 56/57 for nothing. The cost
is instability until stable lands. Skipping Android to make iOS green is
forbidden.

## Failure-handling

P01 pass condition: the research/02 probe (15 checks including Workflow +
Activity on the memory engine) on a real iOS simulator and a real Android
emulator with real polyfills; a bundle importing `effect/unstable/sql` builds
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
