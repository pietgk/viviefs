# ADR-0007: Hybrid logical clock for `tx`

Summary: Every tx is minted by a hybrid logical clock, so order holds offline, across clock jumps and between devices.

Status: Qualified

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

2026-09-20. Ledger pass
`2026-09-20T19-30-57.292Z-6aa3906d`. P04 picked a 5 second future-skew bound.
Mint stayed ordered across backwards wall jumps, reboot (persisted last HLC),
and a remote-ahead receive. Future skew of 5001 ms was rejected. Evidence:
[2026-09-20-p04.md](../evidence/2026-09-20-p04.md).

2026-09-27, P11 step 4. The first server on Postgres with the live clock
failed to save `hlc_state`: physical time was fractional. After boot, mint
time is `correctedOrigin + (monotonicMs - monotonicOrigin)`, and
`performance.now()` has fractions. A fraction beat the last pt, reset the
counter, and the encoder truncated it back, so two txs could share `(pt, c)`
and order by their random bits: a later write could sort before an earlier
one. SQLite stored the fraction silently; P04 did not see it because its
clock is integer. `correctedNow` now returns whole milliseconds, and
`hlc.test.ts` mints from a fractional monotonic clock and requires strictly
increasing `(pt, c)`. Device gates re-run in the P11 closing run.
