# Architectural decision records

ADRs preserve why consequential choices were made. The
[bootstrap plan](../plan/bootstrap/README.md) describes the stack; grilling
decisions D1-D58 are accepted as design intent and unverified until the named
gate. [GLOSSARY.md](../../GLOSSARY.md) defines terms.

## Index

| ADR | Decision | Status | Qualifying gate |
| --- | --- | --- | --- |
| [0001](0001-record-architectural-decisions.md) | Record architectural decisions | Proposed, unverified | none (process) |
| [0002](0002-purpose-scope-and-exemplar.md) | Purpose, scope and the evidence-collection exemplar | Proposed, unverified | none (intent) |
| [0003](0003-effect-v4-as-backbone.md) | Effect v4 RC as the backbone | Qualified | P01 |
| [0004](0004-expo-sdk-58-platform-baseline.md) | Expo SDK 58 and Hermes platform baseline | Qualified | P01 |
| [0005](0005-sqlite-drivers.md) | SQLite drivers: official Effect drivers with expo-sqlite fallback | Qualified | P02 |
| [0006](0006-one-datom-log.md) | One datom log as the substrate | Qualified | P04 |
| [0007](0007-hybrid-logical-clock.md) | Hybrid logical clock for `tx` | Qualified | P04 |
| [0008](0008-single-datom-transactions-with-changesets.md) | Single-datom transactions with changesets | Qualified | P05 |
| [0009](0009-per-attribute-conflict-policies.md) | Per-attribute conflict policies | Qualified | P05 |
| [0010](0010-entity-ids-and-defining-attributes.md) | Entity ids, defining attributes and strict-composition prefixes | Qualified | P05 |
| [0011](0011-log-store-pattern.md) | Log store pattern, read models, compaction and analytics | Qualified | P04, P05 |
| [0012](0012-datom-backed-workflow-engine.md) | Durable execution: Effect Workflow API over one datom-backed engine | Qualified | P06 |
| [0013](0013-device-durability.md) | Device durability: resume on launch, notifications, browser leader | Qualified (P07); P17 unverified | P07, P17 |
| [0014](0014-leases-fencing-and-server-authority.md) | Leases, fencing and server authority | Qualified | P09 |
| [0015](0015-deferreds-vs-machines.md) | Human steps as deferreds; workflows own progress | Qualified | P06, P09 |
| [0016](0016-commands-and-server-validation.md) | Commands, server validation and rejection | Qualified | P09 |
| [0017](0017-sync-outbox-and-cursor-stream.md) | Sync: outbox and cursor stream over Effect RPC | Qualified | P09 |
| [0018](0018-tracing-and-telemetry-sinks.md) | Tracing derived from the log; telemetry sink pattern | Qualified | P03, P10 |
| [0019](0019-ui-state-ownership-and-query-atoms.md) | UI state ownership and live reads with query atoms | Qualified | P05, P08 |
| [0020](0020-interaction-state-three-way-prototype.md) | Interaction state: outcome of the three-way prototype | Qualified | P08 |
| [0021](0021-files-by-content-hash.md) | Files by content hash | Qualified | P09 |
| [0022](0022-identity-and-organization-isolation.md) | Identity and organization isolation | Qualified | P11 |
| [0023](0023-data-at-rest-and-crypto-shredding.md) | Data at rest and crypto-shredding | Proposed, unverified | P15, P16 |
| [0024](0024-repository-structure.md) | Repository structure, tags, rules, generators | Qualified (boundaries, ownership, lint scope); generators unverified | verify (boundary lint) |
| [0025](0025-ai-robust-guardrails.md) | AI-robust guardrails | Qualified (lint rules, Schema at every boundary); per-workflow crash-matrix rule unverified | verify |
| [0026](0026-verify-qualify-teach.md) | Verify - Qualify - Teach | Proposed, unverified | none (process) |
| [0027](0027-developer-experience-planes.md) | Developer experience planes | Proposed, unverified | none (process) |
| [0028](0028-typescript-7-cli-with-typescript-6-api.md) | TypeScript 7 CLI with TypeScript 6 API | Qualified | verify |
| [0029](0029-effect-reference-and-language-service.md) | Effect reference subtree and language service | Qualified | verify |
| [0030](0030-verify-qualify-clis-as-effect-cli.md) | Verify and qualify CLIs as Effect CLI | Qualified | verify |
| [0031](0031-typescript-strictness-flags.md) | TypeScript strictness flags from Effect, evaluated | Qualified | verify |

Every record starts as **Proposed, unverified**. A gate pass with linked evidence
moves it to **Qualified**. **Accepted** is a human status given on the pattern's
guide (concept, design, implementation and review in one template), not on the
decision alone (ADR 0026, amended 2026-09-29).

## Conventions

- Use `NNNN-short-descriptive-title.md`, sequentially numbered from 0001. Do not
  renumber existing records.
- Start with the [template](template.md). This template and these conventions are
  authoritative. They override any ADR format supplied by an installed agent skill.
- Give every ADR a one-line `Summary:` under its title (D88): the site shows it
  when a reference to the ADR is hovered, and the build fails without it.
- Record expected vs observed outcome separately. Observed stays empty until
  evidence exists. Never mark a gate passed from prose.
- Use statuses Proposed (unverified), Qualified, Accepted, Rejected,
  Deprecated, and Superseded. Link a superseding ADR in both directions.
- Accepted records preserve historical rationale. A changed decision gets a new
  ADR. Correcting a typo or adding a clearly dated evidence link does not require
  a new decision.
- Do not duplicate complete specifications. Link the relevant plan section and
  evidence instead. Attribute names pinned at P05 and P06 are frozen (D44).
