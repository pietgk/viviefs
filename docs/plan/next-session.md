# Next session: the words, then build and the app shell

## Prompt to start the session

> Read `AGENTS.md`, then `docs/plan/next-session.md` (this file), then
> [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] and the issue named below as the
> next step. Follow the sequence; a research issue runs with the `research`
> skill, and charting map 3 and each of its tickets is one grilling session
> with a review page (skills `grilling` and `domain-modeling`). Ask before
> deviating from an agreed decision and record a deviation as an ADR
> amendment.

## Where things stand (2026-10-28)

- **The vivief review paused the Schedule.** [I34 vivief as the source of ViViEfs's concepts][I34] (2026-10-05) set out to take
  vivief's ideas into ViViEfs in six wayfinder maps. Map 1, the inventory, is
  done (I35-[I46 Review the vivief inventory][I46]). Map 2, the foundation concepts, has I47-[I50 Contracts checked as data or by commands][I50], [I52 The datom and its store][I52], [I56 One shape at every level?][I56], [I51 Actors or the engine][I51], [I53 Sync and conflict][I53] and [I54 Trust, encryption and who may sign in][I54] resolved:
  what ViViEfs is about ([ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]), what an app is to a device and a node, the
  Presenter pattern and origin trust ([ADR-0033 The Presenter pattern][ADR-0033], [ADR-0034 Origin trust][ADR-0034]), the datom and its
  store, accepting a change ([ADR-0035 Accepting a change][ADR-0035]), one shape at every level ([D130-D135 One shape at every level][D130-D135], [D98' Vision - View - Effects, at every level][D98']): the shape is foundation at the data level and a lens above it; and actors or the engine ([D136-D141 Actors or the engine][D136-D141], [D14' The journal is the fence][D14'], [D39' One engine, one journal, one fence][D39']; [ADR-0036 The journal is the fence][ADR-0036]): the actor level is the durable workflow, and a run's journal is its own fence, so one engine, one journal and one fence serve device and server without Effect Cluster; and sync and conflict ([D142-D148 Sync and conflict][D142-D148], [D34' Per-attribute conflict policies, decided at accept][D34']): sync is in the foundation on purpose, authority decides a human conflict at accept and writes it as a fact a command resolves, a set is entities, and quarantine keeps a rejected change's user content on the device. And trust, encryption and who may sign in ([D149-D157 Trust, encryption and who may sign in][D149-D157]; [ADR-0037 Access][ADR-0037], [ADR-0038 Tamper-evidence and proof of authorship][ADR-0038]): access is decided at accept and at sync's filter as a pattern whose reference implementation is today's membership code; encryption narrows and never grants, at a level each attribute chooses; an identity is who a request or a change is accountable to; whoever grants is the actor; a hash chain per organization is built now, and signing waits for an app. Then [I59 Bring ADR-0002 and the vision page in line with I47][I59] ([D158 The out-of-scope list, item by item][D158], [D159 Product choices stay with the consumer app][D159]; [ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] amended): the out-of-scope list is the vision page's alone, six items each saying what must stay possible and whether it is learnable in the lab, and a consumer app's product choices stay with it for good. And [I55 Accept the foundation concepts][I55] ([D160 The foundation concepts][D160]-[D162 Portability, two halves][D162], [D65' Intent records accepted directly][D65']): all five of vivief's `concepts` are adopted in the forms they landed and the set stays open; [ADR-0032][ADR-0032] lists twelve foundation concepts in one table read as one turn, each with its owning pattern and the gate that shows it; libs stay one per pattern core and implementation; portability's newcomer half goes to map 3. The human accepted [ADR-0032][ADR-0032] and [ADR-0002][ADR-0002] directly, as intent records ([D65'][D65']; `verify`'s list of ADRs accepted directly gained 0032). **Map 2 is done**, and phase 1 with it. Maps 3-6 are not charted.
- **[I78 Research: Effect's vocabulary against ours][I78] is done** ([the record](../research/2026-10-27-effect-vocabulary-against-ours.md), 2026-10-27): every name it listed exists in Effect 4.0.5. Envelope, Journal, Decision and Prompt keep our meaning with Effect's marked; Entity is wording only; Tool clashes inside our own text ([D134 Presenting in any modality][D134]'s "an agent reads a frame through a tool" is Effect's sense). It found eight more clashes (Effects, Worker, Deferred, `tx`, Command, session, model, "tag" for a service) and ideas for map 6 (tool calls run as activities, tool approval, a stored `Exit` reused instead of rerun, a model's name for its origin). The record ends with twelve questions for map 3.
- **Map 3, Vocabulary, is charted** (2026-10-27, [the map](vocabulary/map.md), [the charting review](../research/2026-10-27-the-words-charting.html)): a glossary where each term means one thing, accepted by the human. A single-word term only where its meaning matches our use and the libraries we use, else a compound (a workflow runner, an OPFS worker); tickets edit the living documents a word decision forces, and the linker ([I26 Glossary links on words that are not our terms][I26]) is built inside the map. Nine tickets, I88-[I96 Accept the vocabulary][I96].
- **[I88 Effect and the effect handler][I88] is done** (2026-10-28, [the review](../research/2026-10-27-effect-and-the-effect-handler-review.html), [D163 One meaning of effect, named by phase][D163]-[D169 A command decides][D169]): effect has one meaning, named by phase (asked for: an intent; proposed: a changeset; happened: a fact, a journaled exit), and an `Effect` value is an effect not yet run; Effect and effect are two glossary entries told apart by case, and the docs linker now matches a term as written first and gives a name its capitals in its anchor; the effect handler is a compound term (a command, accept, a workflow body), with no formula of its own; an intent is what a person, an agent or an outside source asks to happen; Vision - View - Effects is one entry; a command decides, marked against `DecisionModel.decide`. [I30 Ideas batch: glossary entries written as effects][I30] is narrowed to its fourth form.
- **[I89 How a word is chosen and written][I89] is done** (2026-10-28, [the review](../research/2026-10-28-how-a-word-is-chosen-and-written-review.html), [D170 One word only where it matches][D170]-[D180 Diagram labels are prose][D180], [D94' The hover line][D94']): a single word is a term only where it matches Effect and the platforms and libraries the code uses, by [D137 One meaning of entity][D137]'s shared core; every term passes the rule, and the sweep sent Origin, Manifest, Intent, Cursor, Engine and actor to [I91 Effect's names against ours][I91]; a compound is written whole every time; an entry ends with `_Like_`, `_Not_` and `_Avoid_` lines, a retired word naming its decision; the glossary opens with [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]'s thesis and Start here, in fourteen groups that follow the one turn. Found on the way: the hover preview showed an entry's first source line, cut mid-sentence for 67 of 123 terms; the first line is now the hover line, checked by the docs build. `verify` has a `glossary` step that reports the term count and unused terms (first report: Token verifier and Bearer authentication, for [I96 Accept the vocabulary][I96]).
- **The Schedule's next step is still the app shell** ([P12 UI on every platform][P12], [P13 Links and routing][P13]). The log-store
  guide is built as a draft; the human judged it not yet good enough to accept
  ([I34 vivief as the source of ViViEfs's concepts][I34]), and accepting a pattern is map 4's.
- **Gates**: [P01 Platform on SDK 58][P01]-[P11 Identity][P11] last passed in one sequential run on `4389ad32c`
  (2026-10-24, run `2026-10-24T13-09-17.522Z-bd1028f3`: [P07 Device resume E2E][P07] on its own agent-device
  daemon, [I79 P07 leaves agent-device replay daemons running][I79]; Expo SDK 58 stable, Effect 4.0.5 and agent-device 0.21.30;
  [ADR-0004 Expo SDK 58 and Hermes platform baseline][ADR-0004]). Phase 3 below changes gate inputs and closes with a
  sequential run.
- **Found while deciding [I50 Contracts checked as data or by commands][I50]**: the server never re-executes a command, so a
  crafted changeset with a blank list title is accepted today ([I69 Accept checks every change][I69]).
- **Found while deciding [I53 Sync and conflict][I53]**: human conflict is not built as decided. The basis means nothing across `node`s (every changeset outside [P05 Changesets and projections][P05] sends `0`), a conflict is never a fact, the server checks write-once only, and a retract cannot remove a human-conflict value ([I81 Build conflicts decided at accept][I81]).
- **Found while deciding [I54 Trust, encryption and who may sign in][I54]**: the log does not say who granted a membership (the operator writes as `server`, [I84 Build the access pattern][I84]); the lease check trusts a device id nobody authenticates ([I80 Build the journal fence][I80]); the roles `Caller` carries are the identity provider's, the same in every organization.

## The sequence (agreed 2026-10-09)

Reasoning and every issue's place:
[2026-10-09 A sequence for the open issues](../research/2026-10-09-issue-sequence-review.html).
An issue not named here is parked until its `Decide when:` fires.

| Phase | Work | Notes |
| --- | --- | --- |
| 0 | Done 2026-10-09: triage; [I5 Confirm the suite catalogue as the one declaration place][I5] and [I3 API reference reads poorly for Effect services][I3] ([D61' Service regions instead of a generated API reference][D61']); [I57 Out-of-scope items in an ADR's trade-offs][I57]; Effect 4.0.2 with the `repos/effect` subtree; [I4 effect-solutions pins an older effect and warns on install][I4], [I6 Post the two upstream issue drafts][I6] and [I23 effect-machine still requires the Effect release candidate][I23] rechecked on it; [I27 The docs development server does not come up reliably, and has no search][I27] fixed (the docs dev server is ready in about 2.5 s and fails visibly). Closed 2026-10-10: [I4][I4]'s warning accepted (`Decide when:` a release peers `effect` ^4); [I27][I27] resolved, search stays `docs:prod`, table text in the index moved to [I73 Table text in the docs search index][I73]; [I72 verify baseline fails in a fresh worktree][I72] triaged to phase 3. Open for the human: post [I6][I6]'s drafts after rereading them. New: [I71 An append can land after a revocation][I71] (reproduced) | [I31 Ideas batch: DataFrames as a universal data format][I31] merged into [I63 The columnar copy as a Presenter implementation][I63]. `@effect/tsgo` 0.51.1 can follow as its own change or with phase 3. |
| 0, background | [I70 Research: access from membership to enterprise][I70] research: access from membership to enterprise | Done 2026-10-09 ([the record](../research/2026-10-09-access-from-membership-to-enterprise.md)); [I54 Trust, encryption and who may sign in][I54] reads it. It found [I71 An append can land after a revocation][I71], a possible race between an append and a revocation, to triage with the rest. |
| 1 | Finish map 2, in this order: [I56 One shape at every level?][I56] (done 2026-10-24), [I51 Actors or the engine][I51] (done 2026-10-26), [I53 Sync and conflict][I53] (done 2026-10-26), [I54 Trust, encryption and who may sign in][I54] (done 2026-10-27), [I59 Bring ADR-0002 and the vision page in line with I47][I59] (done 2026-10-27), [I55 Accept the foundation concepts][I55] (done 2026-10-27) | Each grilling also reviews its overlapping deferred issues with a comment that confirms or narrows the trigger: [I56 One shape at every level?][I56] with [I30 Ideas batch: glossary entries written as effects][I30], [I33 Ideas batch: abstractions that constrain agents][I33]; [I51 Actors or the engine][I51] with [I8 Engine scale-out and a multi-runner server][I8], [I29 Ideas batch: agents that record a replayable run][I29]; [I53 Sync and conflict][I53] with [I11 Quarantine of user content after a lost lease][I11], [I12 Partial sync, history consolidation and client data access][I12]; [I54 Trust, encryption and who may sign in][I54] with [I10 Encryption at rest per consumer app][I10], [I15 Identity, keys and trust][I15], [I16 Roles in use, invitations and self-service membership][I16], [I17 Local deletion after a revoked membership][I17], [I18 Identity provider migration][I18]. [I53][I53]'s server-validation and sync-contract rows were largely answered by [I49 Projection: one concept or several patterns][I49] and [I50 Contracts checked as data or by commands][I50]. |
| 2 | Map 3, Vocabulary (charted 2026-10-27, I88-[I96 Accept the vocabulary][I96]; [I88 Effect and the effect handler][I88] and [I89 How a word is chosen and written][I89] done 2026-10-28), with [I26 Glossary links on words that are not our terms][I26], after [I78 Research: Effect's vocabulary against ours][I78] (done 2026-10-27) | Chart it first, from [I78 Research: Effect's vocabulary against ours][I78]'s record and its questions for map 3 ([D135 Effect's names first][D135]). Words waiting: `Contract`, `effectHandler`, intent, effect, `node`, Tool, Vision, View and Effects, Frame, the lab qualifier, the formula's names ([I30 Ideas batch: glossary entries written as effects][I30]), Surface ([D134 Presenting in any modality][D134]), hot, frontier, warm and cold and the kinds of intent ([D132 Four states at every level][D132]), "abstraction" or "pattern" ([I33 Ideas batch: abstractions that constrain agents][I33]), "change" ([I77 The word change has two meanings][I77]), [I78][I78]'s clashes (Envelope, Journal, Entity, Decision, Tool, Prompt, and the eight it found: Effects, Worker, Deferred, `tx`, Command, session, model, "tag"), foundation concept (it clashes with [D82 Patterns build on each other][D82]'s concept), and a "like X, except Y" line per term where it helps a newcomer ([D162 Portability, two halves][D162]; [I21 Test the glossary with a reader outside software][I21] judges it in map 4). [I26 Glossary links on words that are not our terms][I26] lets the linker tell `node` from Node.js. |
| 3 | Build, then the app shell | A qualification batch first ([I61 Rename evidence-mobile to evidence-client][I61] rename, [I23 effect-machine still requires the Effect release candidate][I23] effect-machine bump, [I72 verify baseline fails in a fresh worktree][I72] fix), then [I66 Attribute value types and the typed reference read model][I66], [I71 An append can land after a revocation][I71], [I69 Accept checks every change][I69] (needs [I66][I66]'s value Schemas), [I84 Build the access pattern][I84] (the access pattern and who grants, after [I69][I69] and [I71][I71]; [P11 Identity][P11] qualified again), [I80 Build the journal fence][I80] (the journal fence, needs [I71][I71]; [P06 Workflow engine crash matrix][P06] and [P09 Sync][P09] qualified again), [I81 Build conflicts decided at accept][I81] (conflicts decided at accept, after [I69][I69] and [I80][I80]; [P05 Changesets and projections][P05] and [P09][P09] qualified again with two devices), [I85 Build the hash chain][I85] (after [I80][I80]; [P09][P09] qualified again with an edited datom), [I67 Minting entity id segments][I67], [I98 Diagram labels and named identifiers get the checks prose gets][I98], then the app shell [P12 UI on every platform][P12], [P13 Links and routing][P13] with [I13 UI renders only in the DOM, never on a device][I13], closed by one sequential run. |
| 4 | Map 4 with [I2 Accept the log-store guide][I2], [I22 Claims and evidence show each gate three times][I22], [I21 Test the glossary with a reader outside software][I21]; the changesets, durable workflow and identity guides; [P14 Quarantine after a lost lease][P14]-[P17 Browser engine leader][P17]; maps 5 and 6 | Map 4 owns accepting a pattern and what counts as evidence; [I21 Test the glossary with a reader outside software][I21] waits for map 3's words. Maps 5 ([I25 Ideas batch: understanding and maintaining code bases][I25]) and 6 ([I24 Ideas batch: understanding LLM output (Andrej Karpathy)][I24], [I29 Ideas batch: agents that record a replayable run][I29]) when needed. |

**Next step:** I90-[I94 Words in another project's sense][I94] in any order, each one grilling with a review page under [I89 How a word is chosen and written][I89]'s rules ([D170 One word only where it matches][D170]-[D180 Diagram labels are prose][D180], [D94' The hover line][D94']; how to write an entry: `docs/agents/domain.md`). [I91 Effect's names against ours][I91] is the largest: Effect's clashes and now the platforms' (Origin, Intent and the rest). Then [I95 Build the glossary linker as decided][I95] (its case-aware lookup and the `_Not_` lines it can read are built), with [I97 A preview on every link in a page's text][I97] in the same linker and [I96 Accept the vocabulary][I96].

## Working notes

- Run Node through mise: `mise exec -- pnpm verify`; `mise exec -- pnpm
  qualify --through P11` for a sequential run on a committed tree. Never run
  `pnpm qualify` as a quick check: every run appends to the ledger.
- `pnpm refs fix` names gate, ADR, decision and issue references in living
  documents ([D86' Named references in every living document][D86']); agents' write-time hooks run it.
- Measured 2026-10-09: `pnpm verify` 19 checks green; its `build` step took
  about 2.3 minutes.
- Measured 2026-09-29: qualify [P01 Platform on SDK 58][P01]-[P11 Identity][P11] about 30 minutes, almost all devices
  and labs; [P06 Workflow engine crash matrix][P06] takes 6 s.
- The ledger's input fingerprint includes the lockfile, workspace, `nx.json`,
  `tsconfig*.json`, `eslint.config.js`, `tools/qualification` and most of
  `libs/`, `apps/evidence-*` and `features/evidence/*` (Markdown excluded).
- Upstream on 2026-10-22: Expo SDK 58 is stable (`expo` 58.0.17 pinned) on
  React Native 0.88.0; Effect 4.0.5 is `latest` and pinned; Effect-TS/effect#6347
  is fixed on `v4/next-minor` (Effect-TS/effect#9157), not yet released.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0002]: ../adr/0002-purpose-scope-and-exemplar.md
[ADR-0004]: ../adr/0004-expo-sdk-58-platform-baseline.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[ADR-0033]: ../adr/0033-the-presenter-pattern.md
[ADR-0034]: ../adr/0034-origin-trust.md
[ADR-0035]: ../adr/0035-accepting-a-change.md
[ADR-0036]: ../adr/0036-the-journal-is-the-fence.md
[ADR-0037]: ../adr/0037-access.md
[ADR-0038]: ../adr/0038-tamper-evidence-and-proof-of-authorship.md
[D130-D135]: bootstrap/02-decision-log.md#d130-d135
[D132]: bootstrap/02-decision-log.md#d132
[D134]: bootstrap/02-decision-log.md#d134
[D135]: bootstrap/02-decision-log.md#d135
[D136-D141]: bootstrap/02-decision-log.md#d136-d141
[D137]: bootstrap/02-decision-log.md#d137
[D14']: bootstrap/02-decision-log.md#d14p
[D142-D148]: bootstrap/02-decision-log.md#d142-d148
[D149-D157]: bootstrap/02-decision-log.md#d149-d157
[D158]: bootstrap/02-decision-log.md#d158
[D159]: bootstrap/02-decision-log.md#d159
[D160]: bootstrap/02-decision-log.md#d160
[D162]: bootstrap/02-decision-log.md#d162
[D163]: bootstrap/02-decision-log.md#d163
[D169]: bootstrap/02-decision-log.md#d169
[D170]: bootstrap/02-decision-log.md#d170
[D180]: bootstrap/02-decision-log.md#d180
[D34']: bootstrap/02-decision-log.md#d34p
[D39']: bootstrap/02-decision-log.md#d39p
[D61']: bootstrap/02-decision-log.md#d61p
[D65']: bootstrap/02-decision-log.md#d65p
[D82]: bootstrap/02-decision-log.md#d82
[D86']: bootstrap/02-decision-log.md#d86p
[D94']: bootstrap/02-decision-log.md#d94p
[D98']: bootstrap/02-decision-log.md#d98p
[I10]: ../issues/0010-encryption-at-rest-per-app.md
[I11]: ../issues/0011-quarantine-after-a-lost-lease.md
[I12]: ../issues/0012-partial-sync-and-history.md
[I13]: ../issues/0013-ui-on-every-platform.md
[I15]: ../issues/0015-identity-keys-and-trust.md
[I16]: ../issues/0016-roles-and-self-service-membership.md
[I17]: ../issues/0017-local-deletion-after-revoked-membership.md
[I18]: ../issues/0018-identity-provider-migration.md
[I2]: ../issues/0002-accept-the-log-store-guide.md
[I21]: ../issues/0021-test-the-glossary-with-a-reader.md
[I22]: ../issues/0022-claims-and-evidence-overlap.md
[I23]: ../issues/0023-effect-machine-on-stable-effect.md
[I24]: ../issues/0024-ideas-batch-andrej-karpathy-understanding.md
[I25]: ../issues/0025-ideas-batch-understanding-and-maintaining-code-bases.md
[I26]: ../issues/0026-glossary-links-on-words-that-are-not-our-terms.md
[I27]: ../issues/0027-docs-dev-server-unreliable-and-without-search.md
[I29]: ../issues/0029-ideas-batch-agents-that-record-a-replayable-run.md
[I3]: ../issues/0003-api-reference-for-effect-services.md
[I30]: ../issues/0030-ideas-batch-glossary-entries-written-as-effects.md
[I31]: ../issues/0031-ideas-batch-dataframes-as-a-universal-data-format.md
[I33]: ../issues/0033-ideas-batch-abstractions-that-constrain-agents.md
[I34]: ../issues/0034-vivief-as-the-source-of-viviefs-concepts.md
[I4]: ../issues/0004-effect-solutions-peer-warning.md
[I46]: ../issues/0046-review-the-vivief-inventory.md
[I49]: ../issues/0049-projection-one-concept-or-several-patterns.md
[I5]: ../issues/0005-confirm-the-suite-catalogue.md
[I50]: ../issues/0050-contracts-checked-as-data-or-by-commands.md
[I51]: ../issues/0051-actors-or-the-engine.md
[I52]: ../issues/0052-the-datom-and-its-store.md
[I53]: ../issues/0053-sync-and-conflict.md
[I54]: ../issues/0054-trust-encryption-and-who-may-sign-in.md
[I55]: ../issues/0055-accept-the-foundation-concepts.md
[I56]: ../issues/0056-one-shape-at-every-level.md
[I57]: ../issues/0057-out-of-scope-items-in-adr-trade-offs.md
[I59]: ../issues/0059-bring-adr-0002-and-the-vision-in-line-with-i47.md
[I6]: ../issues/0006-post-the-upstream-issue-drafts.md
[I61]: ../issues/0061-rename-evidence-mobile-to-evidence-client.md
[I63]: ../issues/0063-the-columnar-copy.md
[I66]: ../issues/0066-attribute-value-types.md
[I67]: ../issues/0067-minting-entity-id-segments.md
[I69]: ../issues/0069-accept-checks-every-change.md
[I70]: ../issues/0070-research-access-from-membership-to-enterprise.md
[I71]: ../issues/0071-an-append-can-land-after-a-revocation.md
[I72]: ../issues/0072-verify-baseline-fails-in-a-fresh-worktree.md
[I73]: ../issues/0073-table-text-in-the-docs-search-index.md
[I77]: ../issues/0077-change-has-two-meanings.md
[I78]: ../issues/0078-research-effect-vocabulary-against-ours.md
[I79]: ../issues/0079-p07-leaves-agent-device-replay-daemons-running.md
[I8]: ../issues/0008-engine-scale-out.md
[I80]: ../issues/0080-build-the-journal-fence.md
[I81]: ../issues/0081-build-conflicts-decided-at-accept.md
[I84]: ../issues/0084-build-the-access-pattern.md
[I85]: ../issues/0085-build-the-hash-chain.md
[I88]: ../issues/0088-effect-and-the-effect-handler.md
[I89]: ../issues/0089-how-a-word-is-chosen-and-written.md
[I91]: ../issues/0091-effects-names-against-ours.md
[I94]: ../issues/0094-words-in-another-projects-sense.md
[I95]: ../issues/0095-build-the-glossary-linker-as-decided.md
[I96]: ../issues/0096-accept-the-vocabulary.md
[I97]: ../issues/0097-a-preview-on-every-link-in-a-pages-text.md
[I98]: ../issues/0098-diagram-labels-and-named-identifiers-get-the-checks-prose-gets.md
[P01]: bootstrap/06-qualification-gates.md#p01
[P05]: bootstrap/06-qualification-gates.md#p05
[P06]: bootstrap/06-qualification-gates.md#p06
[P07]: bootstrap/06-qualification-gates.md#p07
[P09]: bootstrap/06-qualification-gates.md#p09
[P11]: bootstrap/06-qualification-gates.md#p11
[P12]: bootstrap/06-qualification-gates.md#p12
[P13]: bootstrap/06-qualification-gates.md#p13
[P14]: bootstrap/06-qualification-gates.md#p14
[P17]: bootstrap/06-qualification-gates.md#p17
