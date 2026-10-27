# I54: Trust, encryption and who may sign in

Status: resolved

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: [I47 What ViViEfs is about][I47], [I49 Projection: one concept or several patterns][I49], [I70 Research: access from membership to enterprise][I70]

Found: 2026-10-07

## What

Does encryption in ViViEfs serve access and consent, as vivief's `Trust Contract` does, or only erasure and data at rest, and is access part of each read or a server check around sync and commands? With it, the rows [I46 Review the vivief inventory][I46] moved here from map 6: sign-in through OIDC, the organization as the isolation unit and its membership, devices and their local replicas, keys that authenticate a device apart from membership, and integrity by hashing the log ([I15 Identity, keys and trust][I15]).

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from [D94 A glossary a newcomer can read][D94], an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (10): `vivief:trust-contract`, `vivief:projection-access`, `vivief:selective-value-encryption`, `viviefs:crypto-shredding`, `viviefs:data-at-rest`, `viviefs:identity-pattern`, `viviefs:organization-isolation-and-membership`, `viviefs:device-and-local-replica`, `vivief:transport-identity-apart-from-authorization`, `viviefs:tamper-evidence`.

## Answer

Decided with the human on 2026-10-26 and 2026-10-27, over two rounds on [the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html), with [I70 Research: access from membership to enterprise][I70]'s [record](../research/2026-10-09-access-from-membership-to-enterprise.md). The page read vivief's Trust Contract, selective value encryption and device links, and Effect's `eventlog` identity, encryption and authorization, against ours. It found that the lease check trusts a device id nobody authenticates (F1, on [I80 Build the journal fence][I80]), that the roles `Caller` carries are the identity provider's and the same in every organization (F2), that no attribute is personal yet (F3), and that the log does not say who granted a membership: the operator writes as `server` (F7).

**Round 1.** Access is decided around sync and commands, at accept and at sync's filter, never in a read ([D150 Access around sync and commands][D150]). Access is a pattern with [I70 Research: access from membership to enterprise][I70]'s contract and today's code as its reference implementation, the 17 questions answered on the page ([D151 The access pattern][D151]). An agent may have its own identity, an agent account, deferred ([D153 Agent accounts][D153]). The device keeps a revoked organization's copy read-only ([D157 The device after a revoked membership][D157]). The human asked whether encryption could be a pattern with named levels, chose to build the hash chain now, asked what signing now would cost and whether an app could choose, and asked for one meaning of identity that also fits Effect's.

**Round 2**, after sections 10-13 of the page. Encryption is a pattern whose level each attribute chooses, `subject` the reference, and it narrows and never grants ([D149 Encryption levels][D149]). One meaning of identity: who a request or a change is accountable to, proved by a credential; Effect's `EventLog.Identity` is self-certifying ([D152 One meaning of identity][D152]). Whoever grants is the actor ([D154 Whoever grants is the actor][D154]). A hash chain per organization, built now ([D155 A hash chain per organization][D155]). Proof of authorship at a level an app chooses, signing deferred ([D156 Levels of proof of authorship][D156]).

| Row | Disposition |
| --- | --- |
| `vivief:trust-contract` | keep ours: encryption serves erasure and data at rest, never access; its roles are access steps, its AI role an agent account, consent an app's facts the access decision reads ([D149 Encryption levels][D149], [D151 The access pattern][D151], [D153 Agent accounts][D153]) |
| `vivief:projection-access` | keep ours: access at accept and sync's filter, not in each read ([D150 Access around sync and commands][D150]) |
| `vivief:selective-value-encryption` | keep ours: value-only encryption is the `subject` level; keys derived from a passphrase rejected; the `role` level keeps vivief's model possible ([D149 Encryption levels][D149], [I87 Group and role encryption levels][I87]) |
| `viviefs:crypto-shredding` | stands: the `subject` level, random keys, where keys live is [P16 Crypto-shredding][P16]'s ([D149 Encryption levels][D149]) |
| `viviefs:data-at-rest` | stands: a log-store implementation under every level ([D149 Encryption levels][D149], [I10 Encryption at rest per consumer app][I10]) |
| `viviefs:identity-pattern` | stands, with one meaning of identity ([D152 One meaning of identity][D152]) |
| `viviefs:organization-isolation-and-membership` | keep ours, as the access pattern's reference implementation; whoever grants is the actor ([D151 The access pattern][D151], [D154 Whoever grants is the actor][D154]) |
| `viviefs:device-and-local-replica` | stands: a device is not an identity, and nothing trusts its id once [I80 Build the journal fence][I80] lands ([D152 One meaning of identity][D152], [D156 Levels of proof of authorship][D156]) |
| `vivief:transport-identity-apart-from-authorization` | adopt the principle (identity, device keys, transport keys and the account mapping distinct; a key never authorizes); keys deferred to [I15 Identity, keys and trust][I15] ([D156 Levels of proof of authorship][D156]) |
| `viviefs:tamper-evidence` | keep ours, built now: a hash chain per organization ([D155 A hash chain per organization][D155], [I85 Build the hash chain][I85]) |
| `vivief:peer-validation-as-contract` | defer to [I15 Identity, keys and trust][I15] with [I60 Server-independent mode][I60]: the same checkpoint, plus the signature once signed ([D156 Levels of proof of authorship][D156]) |

- **Also decided:** [ADR-0037 Access][ADR-0037] records [D150 Access around sync and commands][D150], [D151 The access pattern][D151] and [D154 Whoever grants is the actor][D154]; [ADR-0038 Tamper-evidence and proof of authorship][ADR-0038] records [D155 A hash chain per organization][D155] and [D156 Levels of proof of authorship][D156]; [ADR-0023 Data at rest and crypto-shredding][ADR-0023] amended with [D149 Encryption levels][D149]; [ADR-0022 Identity and organization isolation][ADR-0022] amended with [D152 One meaning of identity][D152]-[D154][D154] and [D157 The device after a revoked membership][D157]; [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] records [D149-D157 Trust, encryption and who may sign in][D149-D157]. Glossary: Identity, Access decision, Agent account and Encryption level added; Caller, Membership, Bearer authentication, Personal attribute and Tamper-evidence changed.
- **Consequences:** [I84 Build the access pattern][I84] and [I85 Build the hash chain][I85] (phase 3), [I86 Agent accounts][I86] and [I87 Group and role encryption levels][I87] (deferred). Comments on [I10 Encryption at rest per consumer app][I10], [I12 Partial sync, history consolidation and client data access][I12], [I15 Identity, keys and trust][I15] (narrowed, `Decide when:` changed), [I16 Roles in use, invitations and self-service membership][I16], [I17 Local deletion after a revoked membership][I17], [I18 Identity provider migration][I18], [I60 Server-independent mode][I60] and [I80 Build the journal fence][I80].

## Comments

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) leaves inputs here. **Access** stays outside the read: a replica only receives what its account may see, so a Presenter carries no access rule ([D107 The Presenter pattern][D107]); if [I12 Partial sync, history consolidation and client data access][I12] lets a replica hold data its reader may not see, access returns to the read. **Erasure** reaches intermediate presentations (indexes, Parquet, embeddings, caches): ciphertext, or rebuilt when a subject is erased ([D112 Intermediate presentations][D112]). **Redaction** (`vivief:redaction`, an attribute read for computation but never shown) is deferred, `Decide when:` an app has an attribute something computes on that no screen may show; in a Presenter it would be a frame column marked compute-only. **Trust** in data is [ADR-0034](../adr/0034-origin-trust.md) (origin trust, [D115 Origin trust][D115]-[D117 Trust strategies as commit paths][D117]); vivief's Trust Contract (keys, roles, consent) is encryption and stays here.

2026-10-08: [I52](0052-the-datom-and-its-store.md) adds the **blind index** ([D122 External identifiers][D122]). A personal external identifier, such as a national id, is a personal attribute, so it is encrypted per subject and cannot be searched: each person's values use a different key, and the same value encrypts to different bytes each time. Looking one up by value needs a keyed hash of the plain value beside it, made with a secret key, so the same value always gives the same hash. Because a national id has few possible values, anyone holding the hash key can hash them all and reverse the index, so the index must go when the person is erased: it is a read model built from decrypted values on a `node` that holds the keys, and cannot be rebuilt once the person's key is destroyed ([D112 Intermediate presentations][D112]). Deferred, `Decide when:` an app looks up a personal external identifier by value.

2026-10-09: [I50](0050-contracts-checked-as-data-or-by-commands.md) leaves inputs here. **Access is the first question of accepting a change** ([D124 One checkpoint][D124], [ADR-0035 Accepting a change][ADR-0035]): may this writer do this, asked before structure and acceptance rules; a rule that names the writer, such as independent review, is an access decision, not an acceptance rule. **Access as a pattern** is the human's direction: a reference implementation in code (membership, `authority: 'server'`, a command's declared writes) and later implementations (roles, relations as datoms, Cedar policies) answering one request, the subject, action, resource and context of the OpenID AuthZEN Authorization API; [I70 Research: access from membership to enterprise][I70] researches it first, and this ticket decides it. **Trust over structure** (vivief): a rule can only judge a value its checker can read, so a rule on an encrypted attribute checks presence and shape, not content.

2026-10-26: [I51](0051-actors-or-the-engine.md) leaves two inputs here ([D141 The actor is the accountable identity][D141]). The envelope's `actor` is the authenticated identity accountable for a changeset, today a person or the server; **whether an agent may have its own identity** (sign in, hold a membership, be refused what a person may do, such as committing on [D117 Trust strategies as commit paths][D117]'s gated path) is this ticket's question. An agent in a person's session has that person as actor, and inside a server workflow the server; the model is the origin in both. **The kind of identity** (person, server, agent account) is a fact about that identity, read when access is decided, not an envelope field.

2026-10-26: From [I53 Sync and conflict][I53] ([D146 One checkpoint enforces trust][D146]): one checkpoint on the `node` holding authority enforces trust, and a device applies the cursor stream without checking it again. Handed here with `vivief:peer-validation-as-contract`: whether signed changesets let a device check who wrote what, and what a `node` accepting from a peer checks (with [I60 Server-independent mode][I60]).

2026-10-27: Resolved by [D149-D157 Trust, encryption and who may sign in][D149-D157], from [the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0022]: ../adr/0022-identity-and-organization-isolation.md
[ADR-0023]: ../adr/0023-data-at-rest-and-crypto-shredding.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[ADR-0035]: ../adr/0035-accepting-a-change.md
[ADR-0037]: ../adr/0037-access.md
[ADR-0038]: ../adr/0038-tamper-evidence-and-proof-of-authorship.md
[D107]: ../plan/bootstrap/02-decision-log.md#d107
[D112]: ../plan/bootstrap/02-decision-log.md#d112
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D117]: ../plan/bootstrap/02-decision-log.md#d117
[D122]: ../plan/bootstrap/02-decision-log.md#d122
[D124]: ../plan/bootstrap/02-decision-log.md#d124
[D141]: ../plan/bootstrap/02-decision-log.md#d141
[D146]: ../plan/bootstrap/02-decision-log.md#d146
[D149]: ../plan/bootstrap/02-decision-log.md#d149
[D149-D157]: ../plan/bootstrap/02-decision-log.md#d149-d157
[D150]: ../plan/bootstrap/02-decision-log.md#d150
[D151]: ../plan/bootstrap/02-decision-log.md#d151
[D152]: ../plan/bootstrap/02-decision-log.md#d152
[D153]: ../plan/bootstrap/02-decision-log.md#d153
[D154]: ../plan/bootstrap/02-decision-log.md#d154
[D155]: ../plan/bootstrap/02-decision-log.md#d155
[D156]: ../plan/bootstrap/02-decision-log.md#d156
[D157]: ../plan/bootstrap/02-decision-log.md#d157
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I10]: 0010-encryption-at-rest-per-app.md
[I12]: 0012-partial-sync-and-history.md
[I15]: 0015-identity-keys-and-trust.md
[I16]: 0016-roles-and-self-service-membership.md
[I17]: 0017-local-deletion-after-revoked-membership.md
[I18]: 0018-identity-provider-migration.md
[I46]: 0046-review-the-vivief-inventory.md
[I47]: 0047-what-viviefs-is-about.md
[I49]: 0049-projection-one-concept-or-several-patterns.md
[I53]: 0053-sync-and-conflict.md
[I60]: 0060-server-independent-mode.md
[I70]: 0070-research-access-from-membership-to-enterprise.md
[I80]: 0080-build-the-journal-fence.md
[I84]: 0084-build-the-access-pattern.md
[I85]: 0085-build-the-hash-chain.md
[I86]: 0086-agent-accounts.md
[I87]: 0087-group-and-role-encryption-levels.md
[P16]: ../plan/bootstrap/06-qualification-gates.md#p16
