# I83: Live co-editing of text

Status: ready-for-human

Category: enhancement

Decide when: an app needs two people typing in one text at the same time

Found: 2026-10-26

## What

Text has no CRDT: a title is LWW and a person's longer text is human conflict ([D145 Text without a CRDT][D145]), so two people cannot type in one text at the same time.

vivief chose Loro for rich text, one `LoroDoc` per text attribute instance, its content on its own channel beside datom replication (`vivief ADR 0047` §8). From [I53 Sync and conflict][I53] ([the review page](../research/2026-10-26-sync-and-conflict-review.html), example d). When this fires, decide: where the CRDT's state lives (its updates as opaque facts in the log, or beside it on a second channel, [D31 One datom log][D31]); one document per text instance; how acceptance rules ([D125 Acceptance rules][D125]) judge merged text, since authority would run the CRDT too; and whether Loro runs on Hermes, a gate of its own.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D125]: ../plan/bootstrap/02-decision-log.md#d125
[D145]: ../plan/bootstrap/02-decision-log.md#d145
[D31]: ../plan/bootstrap/02-decision-log.md#d31
[I53]: 0053-sync-and-conflict.md
