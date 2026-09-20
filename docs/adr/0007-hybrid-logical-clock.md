# ADR-0007: Hybrid logical clock for `tx`

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P04

Related: D33'. [Architecture section 3](../plan/bootstrap/03-architecture.md).

## Problem

Offline for days must still mint ordered, unique `tx` values. A wall clock
jumps backwards. A corrected clock alone cannot handle those jumps or
cross-device causality. Device-clock UUIDv7 (Effect EventLog) makes skew into
conflict order.

## Design

`tx` is an HLC `(pt, c)`. `pt` is server-corrected time: monotonic clock
anchored to the server offset within a boot session; wall clock plus persisted
offset after a reboot; never below the last persisted HLC. `c` is a tie-break
counter used only when `pt` would not advance.

Mint: if `now > last.pt` then `(now, 0)`, else `(last.pt, last.c + 1)`.
Receive: `last = max(last, received)`. Never mint below anything seen.

Encoded ULID-shaped: 48-bit ms, 16-bit counter, remaining bits random plus
device id. Lexicographically sortable. Offset and last HLC persist in SQLite.
Server rejects future skew and flags measured gaps. P04 picks the actual skew
bound (web-interview used 5s; that number is indicative).

## Trade-offs

HLC is more mechanism than a trusted clock, and it is the mechanism that keeps
offline days and backwards jumps from minting `tx` below history. Pure Lamport
clocks lose physical meaning; pure physical clocks fail on jumps.

## Failure-handling

P04 includes backwards clock, reboot, and remote-ahead cases. Server-side skew
detection is flagged in the trace. The bound and append volume are P04's to
pick, not this ADR's.

## Outcome

### Expected

`tx` is unique, sortable, never below last, and usable as datom identity.

### Observed

Not yet run.
