# I54: Trust, encryption and who may sign in

Status: ready-for-human

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: [I47 What ViViEfs is about][I47], [I49 Projection: one concept or several patterns][I49], [I70 Research: access from membership to enterprise][I70]

Found: 2026-10-07

## What

Does encryption in ViViEfs serve access and consent, as vivief's `Trust Contract` does, or only erasure and data at rest, and is access part of each read or a server check around sync and commands? With it, the rows [I46 Review the vivief inventory][I46] moved here from map 6: sign-in through OIDC, the organization as the isolation unit and its membership, devices and their local replicas, keys that authenticate a device apart from membership, and integrity by hashing the log ([I15 Identity, keys and trust][I15]).

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from [D94 A glossary a newcomer can read][D94], an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (10): `vivief:trust-contract`, `vivief:projection-access`, `vivief:selective-value-encryption`, `viviefs:crypto-shredding`, `viviefs:data-at-rest`, `viviefs:identity-pattern`, `viviefs:organization-isolation-and-membership`, `viviefs:device-and-local-replica`, `vivief:transport-identity-apart-from-authorization`, `viviefs:tamper-evidence`.

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) leaves inputs here. **Access** stays outside the read: a replica only receives what its account may see, so a Presenter carries no access rule ([D107 The Presenter pattern][D107]); if [I12 Partial sync, history consolidation and client data access][I12] lets a replica hold data its reader may not see, access returns to the read. **Erasure** reaches intermediate presentations (indexes, Parquet, embeddings, caches): ciphertext, or rebuilt when a subject is erased ([D112 Intermediate presentations][D112]). **Redaction** (`vivief:redaction`, an attribute read for computation but never shown) is deferred, `Decide when:` an app has an attribute something computes on that no screen may show; in a Presenter it would be a frame column marked compute-only. **Trust** in data is [ADR-0034](../adr/0034-origin-trust.md) (origin trust, [D115 Origin trust][D115]-[D117 Trust strategies as commit paths][D117]); vivief's Trust Contract (keys, roles, consent) is encryption and stays here.

2026-10-08: [I52](0052-the-datom-and-its-store.md) adds the **blind index** ([D122 External identifiers][D122]). A personal external identifier, such as a national id, is a personal attribute, so it is encrypted per subject and cannot be searched: each person's values use a different key, and the same value encrypts to different bytes each time. Looking one up by value needs a keyed hash of the plain value beside it, made with a secret key, so the same value always gives the same hash. Because a national id has few possible values, anyone holding the hash key can hash them all and reverse the index, so the index must go when the person is erased: it is a read model built from decrypted values on a `node` that holds the keys, and cannot be rebuilt once the person's key is destroyed ([D112 Intermediate presentations][D112]). Deferred, `Decide when:` an app looks up a personal external identifier by value.

2026-10-09: [I50](0050-contracts-checked-as-data-or-by-commands.md) leaves inputs here. **Access is the first question of accepting a change** ([D124 One checkpoint][D124], [ADR-0035 Accepting a change][ADR-0035]): may this writer do this, asked before structure and acceptance rules; a rule that names the writer, such as independent review, is an access decision, not an acceptance rule. **Access as a pattern** is the human's direction: a reference implementation in code (membership, `authority: 'server'`, a command's declared writes) and later implementations (roles, relations as datoms, Cedar policies) answering one request, the subject, action, resource and context of the OpenID AuthZEN Authorization API; [I70 Research: access from membership to enterprise][I70] researches it first, and this ticket decides it. **Trust over structure** (vivief): a rule can only judge a value its checker can read, so a rule on an encrypted attribute checks presence and shape, not content.

2026-10-26: [I51](0051-actors-or-the-engine.md) leaves two inputs here ([D141 The actor is the accountable identity][D141]). The envelope's `actor` is the authenticated identity accountable for a changeset, today a person or the server; **whether an agent may have its own identity** (sign in, hold a membership, be refused what a person may do, such as committing on [D117 Trust strategies as commit paths][D117]'s gated path) is this ticket's question. An agent in a person's session has that person as actor, and inside a server workflow the server; the model is the origin in both. **The kind of identity** (person, server, agent account) is a fact about that identity, read when access is decided, not an envelope field.

2026-10-26: From [I53 Sync and conflict][I53] ([D146 One checkpoint enforces trust][D146]): one checkpoint on the `node` holding authority enforces trust, and a device applies the cursor stream without checking it again. Handed here with `vivief:peer-validation-as-contract`: whether signed changesets let a device check who wrote what, and what a `node` accepting from a peer checks (with [I60 Server-independent mode][I60]).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0035]: ../adr/0035-accepting-a-change.md
[D107]: ../plan/bootstrap/02-decision-log.md#d107
[D112]: ../plan/bootstrap/02-decision-log.md#d112
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D117]: ../plan/bootstrap/02-decision-log.md#d117
[D122]: ../plan/bootstrap/02-decision-log.md#d122
[D124]: ../plan/bootstrap/02-decision-log.md#d124
[D141]: ../plan/bootstrap/02-decision-log.md#d141
[D146]: ../plan/bootstrap/02-decision-log.md#d146
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I12]: 0012-partial-sync-and-history.md
[I15]: 0015-identity-keys-and-trust.md
[I46]: 0046-review-the-vivief-inventory.md
[I47]: 0047-what-viviefs-is-about.md
[I49]: 0049-projection-one-concept-or-several-patterns.md
[I53]: 0053-sync-and-conflict.md
[I60]: 0060-server-independent-mode.md
[I70]: 0070-research-access-from-membership-to-enterprise.md
