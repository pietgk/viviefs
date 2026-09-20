# ADR-0005: SQLite drivers

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P02

Related: D16. [research/02](../plan/bootstrap/research/02-effect-v4-react-native.md).

## Problem

The log store is the most failure-sensitive layer. A custom SQLite wrapper would
be extra code at that layer. Effect ships `@effect/sql-sqlite-react-native`
(op-sqlite 17.x) and `@effect/sql-sqlite-wasm` (OPFS). There is no official
expo-sqlite driver.

## Design

Use Effect's official drivers after a gate: `@effect/sql-sqlite-react-native` on
op-sqlite 17.x (pinned; latest op-sqlite is 18 and the peer is `>=17.1.2 <18`)
on native, `@effect/sql-sqlite-wasm` on web. Fallback if that gate fails: our
own `SqlClient` over expo-sqlite (one driver for iOS, Android, web).

## Trade-offs

Official drivers mean less custom code and a shared `SqlClient` with Node and
Postgres. The cost is a peer conflict with op-sqlite 18 and no RN 0.88 New
Architecture proof yet. expo-sqlite is the fallback, not the first attempt.

## Failure-handling

P02: migrations, transactions, EAVT queries and a volume that exercises index
behaviour run on iOS, Android and web. Peer conflict resolved by pinning.
Fallback probe: minimal `SqlClient` over expo-sqlite passes the same checks.
P02 fails if the Android emulator fails.

## Outcome

### Expected

One `SqlClient` contract. Native uses op-sqlite 17.x; web uses OPFS. Fallback
exists as a retained probe, used only if the official drivers fail.

### Observed

Not yet run.
