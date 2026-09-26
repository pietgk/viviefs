# Foundation closure - 2026-09-26

The foundation stage closes on one sequential run of P01-P10 on an unchanged
committed tree ([06-qualification-gates.md](../plan/bootstrap/06-qualification-gates.md)).

Run: `pnpm qualify --foundation`, evidence
`.artifacts/qualification/2026-09-26T20-37-16.903Z-aa8824d9` (gitignored).
Tree: clean on `3bd24492`; no qualification input changed during the run.
Duration: 20:37-21:07 UTC. The ledger records every gate as a pass on that
commit.

| Gate | Ledger (UTC) | What the run printed |
| --- | --- | --- |
| P01 | 20:41:01 | passed on iOS simulator and Android emulator (dev-client) |
| P02 | 20:44:52 | official drivers on iOS, Android and web; expo-sqlite fallback passed the same checks |
| P03 | 20:47:21 | Effect OTLP/JSON on Hermes reached motel from iOS and Android; wrong endpoint did not crash and wrote nothing |
| P04 | 20:49:57 | log store contract on sqlite-node, PGlite, iOS, Android and web; future-skew bound 5000 ms, volume 2000 |
| P05 | 20:52:03 | changesets and projections on sqlite-node, PGlite, iOS, Android and web; TTL 86400000 ms |
| P06 | 20:52:09 | engine resumed after kills on sqlite-node and PGlite, including typed failures; memory engine failed durability |
| P07 | 21:06:59 | force-quit resume on iOS and Android; notification completed a deferred; without the sweep the workflow did not resume |
| P08 | 21:07:06 | IntentComposer: effect-machine copied; LOC xstate 113, effect-machine 200, atom 77 |
| P09 | 21:07:07 | datom replication over Effect RPC (9 checks) |
| P10 | 21:07:27 | durable spans on sqlite-node and PGlite; motel, Jaeger and otel-lgtm hold the trace; a disabled trace cursor kept the backlog and held compaction |

P07 matters most here: it is the first device run of the engine with live
tracing off in workflow bodies (P10), and the first with full-cause exits.

## What it took

Two earlier attempts on the same day failed before measuring anything. Each
failure was in the harness or the app wiring, not in a gate's claim:

- The evidence app bundles `@viviefs/testing`, whose root exported a helper
  that imports `node:fs/promises` (added 2026-09-20, after the last device
  run). Metro cannot resolve it, so P01's export failed. The helper moved to
  `@viviefs/testing/node` (`b402e9484`). `verify`'s `build` step now exports
  the iOS and Android bundles, so this fails `verify` next time.
- iOS device runs relied on a simulator an earlier gate had left booted, and
  a deep link into a still-running app kept its old bundle (Metro runs in CI
  mode without reloads). Every iOS run now boots the simulator, waits for
  `simctl bootstatus`, and stops the app first, as Android already did
  (`b402e9484`, `1616cadd0`, `3bd244926`).

Found in the P10 wrap-up before this run: replay returned a printed cause
instead of the typed exit (`a067a0d6f`, ADR-0012), and compaction could remove
facts a trace cursor had not exported (`babfbc9f4`, ADR-0011, ADR-0018).

## Not covered by closure

- P11-P14 (follow-on; they close before the first consumer app relies on
  them).
- A bundle-size budget: the step still has no target (open items).
- Physical devices, the trace projector on a device, a visible notification
  tap (open items).
