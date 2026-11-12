# I107: Device compaction

Status: needs-triage

Category: enhancement

Decide when: with the sync pattern, before an app needs a device to drop facts

Found: 2026-11-11

## What

No device can remove facts from its log: [D223 Each reader keeps its own place][D223] took `compact()` out of the `LogStore` contract, because whether a removal is safe depends on what the server holds, which only sync knows.

A phone cannot keep every fact forever. A device may remove a fact only when all three of these hold:

1. Every reader on the device has processed it: the projector (its place is `projection_cursor`) and each trace sink (`trace/<sink>`).
2. The server holds it: the device pulled it, or the server accepted the changeset it belongs to.
3. A rebuild can get it back, from the server or from a snapshot. The sync client rebuilds the read models when the server rejects a changeset.

What was removed, and why. `compact()` deleted every datom at or below the lowest acknowledged cursor in `device_cursors`. It was designed on 2026-09-20, when compaction was meant for a log many devices read from ([ADR-0011 Log store pattern, read models, compaction and analytics][ADR-0011]). [D119 Time corrected by authority][D119] then decided that the server's log, the only one devices read from, is never compacted, and no device reads another device's log. A throwaway test on the real code (SQLite, one device, one trace sink, 2026-11-11) showed:

- with only the trace sink registered, `compact()` removed the three facts of a new list before the projector read them, so the list never reached the read models (condition 1);
- after projecting, compacting and calling `rebuild()`, the read models were empty ([A01 Compaction and rebuild do not compose safely](../research/2026-10-29-repo-wide-review.md#a01-compaction-and-rebuild-do-not-compose-safely), condition 3);
- with no consumer registered, nothing was removed.

The [review page](../research/2026-11-11-what-a-device-may-remove-review.html) has the readers of a device's log and the options the human chose from. Server-independent mode ([I60 Server-independent mode][I60]) changes which sync node condition 2 asks.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0011]: ../adr/0011-log-store-pattern.md
[D119]: ../plan/bootstrap/02-decision-log.md#d119
[D223]: ../plan/bootstrap/02-decision-log.md#d223
[I60]: 0060-server-independent-mode.md
