# I6: Post the two upstream issue drafts

Status: ready-for-human

Category: bug

## What

Two issues for Effect are drafted and not posted: the sqlite-wasm client that waits forever when its worker fails, and a comment on Effect-TS/effect#6347 about the Metro migrator import. They are in [upstream-issues.md](../plan/upstream-issues.md); posting is outward-facing, so a human posts them.

## Comments

2026-10-02: Both bugs are still in Effect 4.0.0 and on `main`; the drafts now
name 4.0.0 and the new module paths (`effect/sql/Migrator`). Effect-TS/effect#6347
is still open.

2026-10-09: Rechecked against the `effect@4.0.2` tag, now in `repos/effect`. Both bugs are still there: `OpfsWorker.run` posts nothing when opening fails, and `SqliteClient`'s `onError` never completes `readyDeferred`; `effect/sql/Migrator` still has the dynamic `import(url.href)` in `fromFileSystem`, and #6347 is open. No upstream issue names the sqlite-wasm hang (searched `sqlite-wasm ready` and `OpfsWorker`). The drafts now name 4.0.2; they are posted after the human rereads them.
