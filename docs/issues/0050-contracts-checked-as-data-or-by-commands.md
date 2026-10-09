# I50: Contracts checked as data or by commands

Status: resolved

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: [I47 What ViViEfs is about][I47], [I52 The datom and its store][I52]

Found: 2026-10-07

## What

Do commands, Schema at every boundary and server revalidation cover what ViViEfs's contracts promise, or does the stack need what vivief checks as data at run time: contracts as datoms on every effect, kinds of contract (guard, state machine, aggregation), checks after commit with recorded findings, and the Schema itself as facts in the log? The vivief word `Contract` clashes with ViViEfs's Contract; this ticket decides meaning, map 3 the word.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from [D94 A glossary a newcomer can read][D94], an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (17): `vivief:contract-governed-handler`, `vivief:contract-runtime-needs`, `vivief:runtime-contract-enforcement`, `vivief:schema-contract`, `vivief:schema-evolution`, `vivief:temporal-validation-points`, `vivief:behavior-contract`, `vivief:contract-modes`, `vivief:contract-subtypes`, `vivief:self-describing-datoms`, `viviefs:schema-at-every-boundary`, `vivief:typescript-for-contracts`, `vivief:bridge`, `vivief:intake`, `vivief:asserted-versus-inferred`, `vivief:protocol-version-negotiation`, `vivief:live-evolution`.

## Answer

Decided with the human on 2026-10-08 and 2026-10-09, from [the review page](../research/2026-10-08-contracts-review.html) and in conversation. Checking the code first found that the server does not re-execute a command ([ADR-0016 Commands, server validation and rejection][ADR-0016] Observed): it checks structure only, so `renameList`'s blank-title rule never reaches authority and a crafted changeset with a blank title is accepted. The question became where a rule lives so authority checks it on every changeset, including those no command wrote. **One checkpoint**: authority accepts every change by asking may this writer do this, is it well formed, and does the data stay valid; each check is declared once, runs early on the device and with authority, and has a positive control ([D124 One checkpoint][D124]). **Acceptance rules** are rules about the data alone, code beside the catalog, judged **no worse** so old data stays editable ([D125 Acceptance rules][D125], [D126 No worse][D126]). Every domain writer uses a **registered command** that declares what it writes; the engine's journal is the one exception, and re-running a command on accept, as durable execution replays a workflow, is deferred ([D127 Registered commands][D127]). A rule broken by nothing happening is a workflow writing findings, deferred ([D128 Rules over time][D128]). Boundaries, the RPC and live change follow ([D129 Boundaries and live change][D129], [D44' Never rename, never migrate, the RPC too][D44']), and [D36 Shared commands][D36] is corrected ([D36' Shared commands, as built][D36']). The decisions are [D124-D129 Accepting a change][D124-D129], [D36'][D36'] and [D44'][D44']; [ADR-0035 Accepting a change][ADR-0035] states them, [ADR-0016][ADR-0016] is amended and [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] links them. The glossary gains Acceptance rule; Command and Server are reworded. vivief's word `Contract` stays with map 3: its meaning here splits into a pattern's contract, an acceptance rule, a command's own checks and a rule over time.

**Setting the stage for access.** The human asked whether this overlaps AWS IAM, and whether access could be a pattern that starts minimal and grows to enterprise level inside one contract. All the ways to answer "may this writer do this?" answer one request, which the OpenID AuthZEN Authorization API 1.0 standardizes: a subject, an action, a resource and a context, answered with a decision. **Code** (today: membership, `authority: 'server'`, declared writes) answers it fast but cannot be asked "who may approve?". **Roles** ([I16 Roles in use, invitations and self-service membership][I16]) add role datoms beside the membership datom. **Relations in the style of Google's Zanzibar** store every permission as a tuple `object#relation@user` (`item:O1/L1/I7#reviewer@person:P42`), nearly a datom; its paper's new enemy problem, a check that reads permissions older than the change it guards, cannot arise with one authority but can with several `node`s, where a `tx` would play its consistency token. **Cedar** policies are `permit` and `forbid` statements with conditions, default deny and forbid overriding permit, typed by a schema and provable by analysis; independent review is `permit (principal in Role::"reviewer", action == Action::"evidence.approveItem", resource) when { resource.author != principal };`. That example moved independent review from acceptance rules to access: a rule that names the writer is an access decision. Access as a pattern over these four is a direction, researched in [I70 Research: access from membership to enterprise][I70] and decided in [I54 Trust, encryption and who may sign in][I54]; the review page has the full explainers.

| Row | Disposition |
| --- | --- |
| `vivief:contract-governed-handler` | adopt as one checkpoint: preconditions are the command's own checks and the access decision, postconditions on the result are acceptance rules run on the changeset ([D124 One checkpoint][D124], [D125 Acceptance rules][D125]) |
| `vivief:contract-runtime-needs` | adopt pre-commit as acceptance rules ([D125 Acceptance rules][D125]) and post-commit as rules over time, deferred ([D128 Rules over time][D128]); in-flight deferred with in-flight freshness ([D109 Frame and frame subscription][D109]); a state machine is an allowed-transition rule; no aggregation pipeline ([D111 Faster and enriching implementations][D111]) |
| `vivief:runtime-contract-enforcement` | adopt the placement, every changeset checked by authority whatever wrote it ([D124 One checkpoint][D124]); contracts as datoms rejected ([D118 What a datom needs from storage][D118]); not retroactive as no worse ([D126 No worse][D126]); invariants over time deferred ([D128 Rules over time][D128]) |
| `vivief:schema-contract` | keep ours: the value Schema in the catalog ([D121 Attribute value types][D121]); the Schema as datoms rejected ([D118 What a datom needs from storage][D118]) |
| `vivief:schema-evolution` | keep ours, the stricter form ([D44 Never rename, never migrate][D44], [D44' Never rename, never migrate, the RPC too][D44']); migration as creation not adopted; a label that changes is a translation, not a rename |
| `vivief:temporal-validation-points` | adopt pre-commit ([D125 Acceptance rules][D125]) and post-commit ([D128 Rules over time][D128], deferred); in-flight deferred ([D109 Frame and frame subscription][D109]) |
| `vivief:behavior-contract` | adopt as declared writes on registered commands ([D127 Registered commands][D127]); `produces.required` becomes an acceptance rule on the entity |
| `vivief:contract-modes` | adopt guard as acceptance rules and state machine as allowed transitions ([D125 Acceptance rules][D125]); aggregation is a projection or an enriching implementation ([D111 Faster and enriching implementations][D111]) |
| `vivief:contract-subtypes` | reject the closed set of six: each lands on one pattern's contract, and that set stays open ([D82 Patterns build on each other][D82], [D125 Acceptance rules][D125]) |
| `vivief:self-describing-datoms` | stands rejected: the ledger and the Schema stay out of the log; an app's own run-time evidence is that app's data ([D48' Verify - Qualify - Teach][D48'], [D118 What a datom needs from storage][D118], [D129 Boundaries and live change][D129]) |
| `viviefs:schema-at-every-boundary` | stands |
| `vivief:typescript-for-contracts` | stands |
| `vivief:bridge` | keep ours: Schema at every boundary and the origin in, an activity out; no bridge pattern; trust at the boundary is origin trust ([D129 Boundaries and live change][D129]) |
| `vivief:intake` | adopt as origin trust ([D115 Origin trust][D115], [D129 Boundaries and live change][D129]); a trust score per source at ingestion not adopted |
| `vivief:asserted-versus-inferred` | adopt as the origin and its inputs' origins ([D58' Envelope names the origin][D58'], [D111 Faster and enriching implementations][D111]); a source span deferred, `Decide when:` an app cites a place in a document ([D129 Boundaries and live change][D129]) |
| `vivief:protocol-version-negotiation` | keep ours, extended to the RPC: additive only; a version handshake deferred, `Decide when:` the first consumer app ships to a store ([D44' Never rename, never migrate, the RPC too][D44']) |
| `vivief:live-evolution` | reject handlers as data ([D52 Four project kinds][D52]); feature flags deferred, `Decide when:` a consumer app must try a change on one organization without a release, their form open ([D129 Boundaries and live change][D129]) |

- **Also from vivief's `Contract`**: spec, test and guard at once is adopted (a rule without a positive control fails `verify`); enforcement follows trust is the principle behind [D124 One checkpoint][D124]; graduated enforcement becomes a deferred warning rule ([D125 Acceptance rules][D125]); trust over structure is a note on [I54 Trust, encryption and who may sign in][I54]; its defaults lifecycle is already [D116 Trust levels and who sets them][D116]'s shape; its contract lifecycle and locks are rejected with contracts as datoms.
- **Consequences:** [I69 Accept checks every change][I69] (accept checks every change, with the blank title as its first positive control), [I70 Research: access from membership to enterprise][I70] (research: access from membership to enterprise, before [I54 Trust, encryption and who may sign in][I54]); comments on [I16 Roles in use, invitations and self-service membership][I16], [I54][I54], [I60 Server-independent mode][I60], [I63 The columnar copy as a Presenter implementation][I63], [I66 Attribute value types and the typed reference read model][I66] and [I68 Uniqueness as an acceptance rule][I68].

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0016]: ../adr/0016-commands-and-server-validation.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[ADR-0035]: ../adr/0035-accepting-a-change.md
[D109]: ../plan/bootstrap/02-decision-log.md#d109
[D111]: ../plan/bootstrap/02-decision-log.md#d111
[D115]: ../plan/bootstrap/02-decision-log.md#d115
[D116]: ../plan/bootstrap/02-decision-log.md#d116
[D118]: ../plan/bootstrap/02-decision-log.md#d118
[D121]: ../plan/bootstrap/02-decision-log.md#d121
[D124]: ../plan/bootstrap/02-decision-log.md#d124
[D124-D129]: ../plan/bootstrap/02-decision-log.md#d124-d129
[D125]: ../plan/bootstrap/02-decision-log.md#d125
[D126]: ../plan/bootstrap/02-decision-log.md#d126
[D127]: ../plan/bootstrap/02-decision-log.md#d127
[D128]: ../plan/bootstrap/02-decision-log.md#d128
[D129]: ../plan/bootstrap/02-decision-log.md#d129
[D36]: ../plan/bootstrap/02-decision-log.md#d36
[D36']: ../plan/bootstrap/02-decision-log.md#d36p
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[D44']: ../plan/bootstrap/02-decision-log.md#d44p
[D48']: ../plan/bootstrap/02-decision-log.md#d48p
[D52]: ../plan/bootstrap/02-decision-log.md#d52
[D58']: ../plan/bootstrap/02-decision-log.md#d58p
[D82]: ../plan/bootstrap/02-decision-log.md#d82
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I16]: 0016-roles-and-self-service-membership.md
[I47]: 0047-what-viviefs-is-about.md
[I52]: 0052-the-datom-and-its-store.md
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[I60]: 0060-server-independent-mode.md
[I63]: 0063-the-columnar-copy.md
[I66]: 0066-attribute-value-types.md
[I68]: 0068-uniqueness-as-an-acceptance-rule.md
[I69]: 0069-accept-checks-every-change.md
[I70]: 0070-research-access-from-membership-to-enterprise.md
