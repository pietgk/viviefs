# I85: Build the hash chain

Status: ready-for-agent

Category: enhancement

Blocked by: [I80 Build the journal fence][I80]

Found: 2026-10-27

## What

Stored history is trusted, not provable: an edited datom on the server goes unnoticed by every device; build [D155 A hash chain per organization][D155] ([ADR-0038 Tamper-evidence and proof of authorship][ADR-0038]) so each organization's accepted history is a hash chain every device recomputes.

From [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html), example e and section 11).

### What to build

1. **The canonical encoding**, with a version name and frozen ([D44' Never rename, never migrate, the RPC too][D44']): the changeset as its writer made it (the envelope without what authority adds at accept, the datoms in order), sealed values as ciphertext. The same bytes a signature will later sign ([D156 Levels of proof of authorship][D156]).
2. **The chain at accept.** Each accepted changeset's hash over its bytes and the previous hash, written in the same transaction as the append. One chain per organization in server sequence; one for the server-only root.
3. **Checked by devices.** `Pull` names the head; a device recomputes the chain over what it pulls and raises a typed alarm on a mismatch, never repairing silently.
4. **An audit tool** checks the server-only chain.
5. **Gate.** [P09 Sync][P09] qualified again: a datom edited in Postgres is caught by the next pull on iOS, Android and web; positive control: an unedited log raises no alarm; an erased subject's ciphertext still chains.

### To design first

- Where the hash lives: beside `acceptedAt` among what authority stamps on the envelope, or as a server-written fact per changeset.
- How a device that joins late starts: from the genesis of its organization's chain, which whole-organization sync gives it.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0038]: ../adr/0038-tamper-evidence-and-proof-of-authorship.md
[D155]: ../plan/bootstrap/02-decision-log.md#d155
[D156]: ../plan/bootstrap/02-decision-log.md#d156
[D44']: ../plan/bootstrap/02-decision-log.md#d44p
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I80]: 0080-build-the-journal-fence.md
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
