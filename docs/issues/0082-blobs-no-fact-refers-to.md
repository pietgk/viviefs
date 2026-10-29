# I82: Blobs no fact refers to

Status: ready-for-human

Category: enhancement

Decide when: [P14 Quarantine after a lost lease][P14]'s grilling (quarantine decides what still holds a blob), or a server's blob storage is measured growing

Found: 2026-10-26

## What

The server keeps blobs that no accepted fact refers to, and nothing removes them.

Accept checks a changeset's files before its write-once facts (`libs/sync/server/src/server.ts`, files before write-once), so the device uploads the file and only then learns the changeset is rejected. From [I53 Sync and conflict][I53] ([the review page](../research/2026-10-26-sync-and-conflict-review.html), section 9): quarantine keeps such content on the device ([D148 Quarantine is rejected user content][D148]), so the server's copy is held by nothing. A retention rule decides when such a blob goes, and what still holds one (quarantine on a device, an open changeset, a compaction horizon).

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D148]: ../plan/bootstrap/02-decision-log.md#d148
[I53]: 0053-sync-and-conflict.md
[P14]: ../plan/bootstrap/06-qualification-gates.md#p14
