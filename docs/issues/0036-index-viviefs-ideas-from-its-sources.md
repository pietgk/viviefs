# I36: Index ViViEfs's ideas from its sources

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: research

Found: 2026-10-05

Claimed: 2026-10-05

## What

Which ideas make up ViViEfs, named once so the inventory can say for each where it stands in vivief? Read ViViEfs's sources: `GLOSSARY.md` (101 terms), the decision log [D1 A reference stack][D1]-[D94 A glossary a newcomer can read][D94] (`docs/plan/bootstrap/02-decision-log.md`), [ADR-0001 Record architectural decisions][ADR-0001] to [ADR-0031 TypeScript strictness flags from Effect, evaluated][ADR-0031] (`docs/adr/`), the gates [P01 Platform on SDK 58][P01]-[P17 Workflow engine leader in a browser][P17] (`docs/plan/bootstrap/06-qualification-gates.md`, with `tools/qualification/gate-ledger.json` for which passed) and the log-store guide (`apps/docs/src/content/docs/guides/log-store/`).

Write `docs/plan/vivief-inventory/rows/I36.md`: one row per ViViEfs idea with a `viviefs:<kebab-slug>` id, its sources and its level, grouping the sources that state one idea (a glossary term, the decision that set it, its ADR, the gate that proved it) into one row. Leave the vivief side empty; the slices and [I45 Assemble the vivief inventory][I45] fill it. The coverage table has one line per glossary term, decision, ADR, gate and guide page, naming the row it fed. Follow the [map](../plan/vivief-inventory/map.md) Notes.

## Answer

77 rows, in [rows/I36.md](../plan/vivief-inventory/rows/I36.md), with a coverage line for each of the 101 glossary terms, [D1 A reference stack][D1]-[D94 A glossary a newcomer can read][D94] (the two unanswered questions 4 and 5 share one line), [ADR-0001 Record architectural decisions][ADR-0001] to [ADR-0031 TypeScript strictness flags from Effect, evaluated][ADR-0031] with the README and template, [P01 Platform on SDK 58][P01]-[P17 Workflow engine leader in a browser][P17] and the ten guide pages. Most rows join a glossary group, its decision, its ADR and its gate: 35 are `verified` ([P01][P01]-[P11 Identity][P11] have ledger passes), 23 `implemented` (checked by `verify`, no gate), 8 `proposed` (on [ADR-0001][ADR-0001], 0002, 0023, 0026, 0027 and [ADR-0013 Device durability][ADR-0013]'s [P17][P17] part) and 11 `accepted` (a decision, term or freeze only, including the ideas of [P12 UI on every platform][P12]-[P14 Quarantine after a lost lease][P14], which have no ledger entry).
Ambiguities: Drain before close has no decision, ADR or gate; Tamper-evidence names an absence; the Identity terms and the four span terms come from the [P11][P11] grilling and [P10 Trace projection][P10] picks ([ADR-0022 Identity and organization isolation][ADR-0022], [ADR-0018 Tracing derived from the log; telemetry sink pattern][ADR-0018]), not from numbered decisions. Patterns and principles with no glossary term: telemetry sink, sync, links and routing, UI on every platform, quarantine, never rename or migrate, data at rest, research record, issue. For the four primed decisions, the log keeps only the refined answer, not the first one. The ADR README still says "[D1][D1]-[D58 Envelope per changeset][D58]", and [ADR-0001][ADR-0001]'s Observed predates the 26 Qualified ADRs.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0001]: ../adr/0001-record-architectural-decisions.md
[ADR-0013]: ../adr/0013-device-durability.md
[ADR-0018]: ../adr/0018-tracing-and-telemetry-sinks.md
[ADR-0022]: ../adr/0022-identity-and-organization-isolation.md
[ADR-0031]: ../adr/0031-typescript-strictness-flags.md
[D1]: ../plan/bootstrap/02-decision-log.md#d1
[D58]: ../plan/bootstrap/02-decision-log.md#d58
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I45]: 0045-assemble-the-vivief-inventory.md
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P10]: ../plan/bootstrap/06-qualification-gates.md#p10
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
[P12]: ../plan/bootstrap/06-qualification-gates.md#p12
[P14]: ../plan/bootstrap/06-qualification-gates.md#p14
[P17]: ../plan/bootstrap/06-qualification-gates.md#p17
