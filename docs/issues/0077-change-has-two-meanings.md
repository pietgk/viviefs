# I77: The word change has two meanings

Status: ready-for-human

Category: enhancement

Decide when: map 3

Found: 2026-10-23

## What

"Change" means a data changeset in [ADR-0035 Accepting a change][ADR-0035] ("Accepting a change": authority "accepts or rejects every change") and a code change in the glossary's Verify entry ("The full set of checks every change must pass before it is done"). Found in [I56](0056-one-shape-at-every-level.md) while naming the verified commit ([D133 Verified commit][D133]).

The two are parallel ([D132 Four states at every level][D132]: a changeset is the data level's step, a commit the code level's), which is why one word fits both, and why a reader can take one for the other. Map 3 decides whether "change" stays a plain word for both, or one of the two pages says "changeset" or "commit" instead. "Code changeset" is already avoided ([D133 Verified commit][D133]).

## Comments

2026-10-27: map 3 started. Decided and resolved in [I92 Map 2's new words][I92] Map 2's new words.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0035]: ../adr/0035-accepting-a-change.md
[D132]: ../plan/bootstrap/02-decision-log.md#d132
[D133]: ../plan/bootstrap/02-decision-log.md#d133
[I92]: 0092-map-2s-new-words.md
