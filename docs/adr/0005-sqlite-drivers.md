# ADR-0005: SQLite drivers

Status: Qualified

Date: 2026-09-20

Qualifying gate: P02

Related: D16. [research/02](../plan/bootstrap/research/02-effect-v4-react-native.md).
Amendment: D16 named op-sqlite 17.x; P02 measured that 17.x does not compile on
RN 0.88 New Architecture.

## Problem

The log store is the most failure-sensitive layer. A custom SQLite wrapper would
be extra code at that layer. Effect ships `@effect/sql-sqlite-react-native`
(peer `>=17.1.2 <18`) and `@effect/sql-sqlite-wasm` (OPFS). There is no official
expo-sqlite driver.

## Design

Use Effect's official drivers: `@effect/sql-sqlite-react-native` on
`@op-engineering/op-sqlite@18.2.5` (workspace override; Effect's peer is still
`<18`) on native, `@effect/sql-sqlite-wasm` with OPFS on web. The expo-sqlite
`SqlClient` remains a retained fallback probe, not the shipped adapter.

D16 named 17.x. 17.1.3 and 17.2.0 fail to compile on RN 0.88 because
`RCTCxxBridge` was removed in 0.87. 18.2.5 installs JSI via `RCTBridgeProxy`.
That pin is the P02-measured resolution of the peer conflict.

## Trade-offs

Official drivers mean less custom code and a shared `SqlClient` with Node and
Postgres. The remaining cost is an Effect peer range that has not caught up to
op-sqlite 18, recorded as a pnpm override. expo-sqlite is the fallback, not the
first attempt.

## Failure-handling

P02: migrations, transactions, EAVT queries and a volume that exercises index
behaviour run on iOS, Android and web. Peer conflict resolved by pinning 18.2.5.
Fallback probe: minimal `SqlClient` over expo-sqlite passes the same checks.
P02 fails if the Android emulator fails.

## Outcome

### Expected

One `SqlClient` contract. Native uses op-sqlite (17.x in D16; 18.2.5 as
measured). Web uses OPFS. Fallback exists as a retained probe, used only if the
official drivers fail.

### Observed

2026-09-20. Ledger pass
`2026-09-20T15-51-08.575Z-40d6f8ab`. Six checks (migrate, transaction commit,
transaction rollback, eavt by entity, eavt by attribute, index volume) passed
on iOS, Android and web for both the official driver and the expo-sqlite
fallback. Android emulator required and green. Evidence:
[2026-09-20-p02.md](../evidence/2026-09-20-p02.md).

