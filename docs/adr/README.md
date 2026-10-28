# Architectural decision records

ADRs preserve why consequential choices were made. The
[bootstrap plan](../plan/bootstrap/README.md) describes the stack; the grilling decisions in its
[decision log](../plan/bootstrap/02-decision-log.md) are accepted as design
intent and unverified until the named gate. [GLOSSARY.md](../../GLOSSARY.md) defines terms.

## Index

| ADR | Decision | Status | Qualifying gate |
| --- | --- | --- | --- |
| [0001](0001-record-architectural-decisions.md) | Record architectural decisions | Proposed, unverified | none (process) |
| [0002](0002-purpose-scope-and-exemplar.md) | Purpose, scope and the evidence-collection exemplar | Accepted | none (intent) |
| [0003](0003-effect-v4-as-backbone.md) | Effect v4 as the backbone | Qualified | [P01 Platform on SDK 58][P01] |
| [0004](0004-expo-sdk-58-platform-baseline.md) | Expo SDK 58 and Hermes platform baseline | Qualified | [P01 Platform on SDK 58][P01] |
| [0005](0005-sqlite-drivers.md) | SQLite drivers: official Effect drivers with expo-sqlite fallback | Qualified | [P02 SQLite drivers][P02] |
| [0006](0006-one-datom-log.md) | One datom log as the substrate | Qualified | [P04 Log store conformance][P04] |
| [0007](0007-hybrid-logical-clock.md) | Hybrid logical clock for `tx` | Qualified | [P04 Log store conformance][P04] |
| [0008](0008-single-datom-transactions-with-changesets.md) | Single-datom transactions with changesets | Qualified | [P05 Changesets and projections][P05] |
| [0009](0009-per-attribute-conflict-policies.md) | Per-attribute conflict policies | Qualified | [P05 Changesets and projections][P05] |
| [0010](0010-entity-ids-and-defining-attributes.md) | Entity ids, defining attributes and strict-composition prefixes | Qualified | [P05 Changesets and projections][P05] |
| [0011](0011-log-store-pattern.md) | Log store pattern, read models, compaction and analytics | Qualified | [P04 Log store conformance][P04], [P05 Changesets and projections][P05] |
| [0012](0012-datom-backed-workflow-engine.md) | Durable execution: Effect Workflow API over one datom-backed workflow engine | Qualified | [P06 Workflow engine crash matrix][P06] |
| [0013](0013-device-durability.md) | Device durability: resume on launch, notifications, browser leader | Qualified ([P07 Device resume E2E][P07]); [P17 Browser engine leader][P17] unverified | [P07 Device resume E2E][P07], [P17 Browser engine leader][P17] |
| [0014](0014-leases-fencing-and-server-authority.md) | Leases, fencing and server authority (lease design to be superseded by [ADR-0036 The journal is the fence][ADR-0036]) | Qualified | [P09 Sync][P09] |
| [0015](0015-deferreds-vs-machines.md) | Human steps as durable deferreds; workflows own progress | Qualified | [P06 Workflow engine crash matrix][P06], [P09 Sync][P09] |
| [0016](0016-commands-and-server-validation.md) | Commands, server validation and rejection | Qualified | [P09 Sync][P09] |
| [0017](0017-sync-outbox-and-cursor-stream.md) | Sync: outbox and sync cursor stream over Effect RPC | Qualified | [P09 Sync][P09] |
| [0018](0018-tracing-and-telemetry-sinks.md) | Tracing derived from the log; telemetry sink pattern | Qualified | [P03 OTLP and motel][P03], [P10 Trace projection][P10] |
| [0019](0019-ui-state-ownership-and-query-atoms.md) | UI state ownership and live reads with query atoms | Qualified | [P05 Changesets and projections][P05], [P08 UI three-way prototype][P08] |
| [0020](0020-interaction-state-three-way-prototype.md) | Interaction state: outcome of the three-way prototype | Qualified | [P08 UI three-way prototype][P08] |
| [0021](0021-files-by-content-hash.md) | Files by content hash | Qualified | [P09 Sync][P09] |
| [0022](0022-identity-and-organization-isolation.md) | Identity and organization isolation | Qualified | [P11 Identity][P11] |
| [0023](0023-data-at-rest-and-crypto-shredding.md) | Data at rest and crypto-shredding | Proposed, unverified | [P15 Encrypted store][P15], [P16 Crypto-shredding][P16] |
| [0024](0024-repository-structure.md) | Repository structure, tags, rules, generators | Qualified (boundaries, ownership, lint scope); generators unverified | verify (boundary lint) |
| [0025](0025-ai-robust-guardrails.md) | AI-robust guardrails | Qualified (lint rules, Schema at every boundary); per-workflow crash-matrix rule unverified | verify |
| [0026](0026-verify-qualify-teach.md) | Verify - Qualify - Teach | Proposed, unverified | none (process) |
| [0027](0027-developer-experience-planes.md) | Developer experience planes | Proposed, unverified | none (process) |
| [0028](0028-typescript-7-cli-with-typescript-6-api.md) | TypeScript 7 CLI with TypeScript 6 API | Qualified | verify |
| [0029](0029-effect-reference-and-language-service.md) | Effect reference subtree and language service | Qualified | verify |
| [0030](0030-verify-qualify-clis-as-effect-cli.md) | Verify and qualify CLIs as Effect CLI | Qualified | verify |
| [0031](0031-typescript-strictness-flags.md) | TypeScript strictness flags from Effect, evaluated | Qualified | verify |
| [0032](0032-what-viviefs-is-about.md) | What ViViEfs is about and its foundation concepts | Accepted | none (intent) |
| [0033](0033-the-presenter-pattern.md) | The Presenter pattern | Proposed, unverified | Presenter conformance gate ([I62 The Presenter conformance gate][I62]), to come |
| [0034](0034-origin-trust.md) | Origin trust | Proposed, unverified | named when built ([I64 Build origin trust][I64]) |
| [0035](0035-accepting-a-change.md) | Accepting a change | Proposed, unverified | [P09 Sync][P09] extended ([I69 Accept checks every change][I69]), to come |
| [0036](0036-the-journal-is-the-fence.md) | The journal is the fence | Proposed, unverified | [P06 Workflow engine crash matrix][P06] and [P09 Sync][P09] again, when built ([I80 Build the journal fence][I80]) |
| [0037](0037-access.md) | Access | Proposed, unverified | [P11 Identity][P11] again, when built ([I84 Build the access pattern][I84]) |
| [0038](0038-tamper-evidence-and-proof-of-authorship.md) | Tamper-evidence and proof of authorship | Proposed, unverified | [P09 Sync][P09] again, when the chain is built ([I85 Build the hash chain][I85]) |

Every record starts as **Proposed, unverified**. A gate pass with linked evidence
moves it to **Qualified**. **Accepted** is a human status given on the pattern's
guide (concept, design, implementation and review in one template), not on the
decision alone ([ADR-0026 Verify - Qualify - Teach][ADR-0026], amended 2026-09-29).
An intent record, with no pattern and no gate (0001, 0002, 0032), is accepted
directly by the human ([D65' Intent records accepted directly][D65']).

## Conventions

- Use `NNNN-short-descriptive-title.md`, sequentially numbered from 0001. Do not
  renumber existing records.
- Start with the [template](template.md). This template and these conventions are
  authoritative. They override any ADR format supplied by an installed agent skill.
- Give every ADR a one-line `Summary:` under its title ([D88 Names and summaries][D88]): the site shows it
  when a reference to the ADR is hovered, and the build fails without it.
- Record expected vs observed outcome separately. Observed stays empty until
  evidence exists. Never mark a gate passed from prose.
- Use statuses Proposed (unverified), Qualified, Accepted, Rejected,
  Deprecated, and Superseded. Link a superseding ADR in both directions.
- Accepted records preserve historical rationale. A changed decision gets a new
  ADR. Correcting a typo or adding a clearly dated evidence link does not require
  a new decision.
- Do not duplicate complete specifications. Link the relevant plan section and
  evidence instead. Attribute names pinned at [P05 Changesets and projections][P05] and [P06 Workflow engine crash matrix][P06] are frozen ([D44 Never rename, never migrate][D44]).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0026]: 0026-verify-qualify-teach.md
[ADR-0036]: 0036-the-journal-is-the-fence.md
[D44]: ../plan/bootstrap/02-decision-log.md#d44
[D65']: ../plan/bootstrap/02-decision-log.md#d65p
[D88]: ../plan/bootstrap/02-decision-log.md#d88
[I62]: ../issues/0062-presenter-conformance-gate.md
[I64]: ../issues/0064-build-origin-trust.md
[I69]: ../issues/0069-accept-checks-every-change.md
[I80]: ../issues/0080-build-the-journal-fence.md
[I84]: ../issues/0084-build-the-access-pattern.md
[I85]: ../issues/0085-build-the-hash-chain.md
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P02]: ../plan/bootstrap/06-qualification-gates.md#p02
[P03]: ../plan/bootstrap/06-qualification-gates.md#p03
[P04]: ../plan/bootstrap/06-qualification-gates.md#p04
[P05]: ../plan/bootstrap/06-qualification-gates.md#p05
[P06]: ../plan/bootstrap/06-qualification-gates.md#p06
[P07]: ../plan/bootstrap/06-qualification-gates.md#p07
[P08]: ../plan/bootstrap/06-qualification-gates.md#p08
[P09]: ../plan/bootstrap/06-qualification-gates.md#p09
[P10]: ../plan/bootstrap/06-qualification-gates.md#p10
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
[P15]: ../plan/bootstrap/06-qualification-gates.md#p15
[P16]: ../plan/bootstrap/06-qualification-gates.md#p16
[P17]: ../plan/bootstrap/06-qualification-gates.md#p17
