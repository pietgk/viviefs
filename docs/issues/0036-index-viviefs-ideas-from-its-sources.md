# I36: Index ViViEfs's ideas from its sources

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: research

Found: 2026-10-05

Claimed: 2026-10-05

## What

Which ideas make up ViViEfs, named once so the inventory can say for each where it stands in vivief? Read ViViEfs's sources: `GLOSSARY.md` (101 terms), the decision log D1-D94 (`docs/plan/bootstrap/02-decision-log.md`), ADR-0001 to ADR-0031 (`docs/adr/`), the gates P01-P17 (`docs/plan/bootstrap/06-qualification-gates.md`, with `tools/qualification/gate-ledger.json` for which passed) and the log-store guide (`apps/docs/src/content/docs/guides/log-store/`).

Write `docs/plan/vivief-inventory/rows/I36.md`: one row per ViViEfs idea with a `viviefs:<kebab-slug>` id, its sources and its level, grouping the sources that state one idea (a glossary term, the decision that set it, its ADR, the gate that proved it) into one row. Leave the vivief side empty; the slices and I45 fill it. The coverage table has one line per glossary term, decision, ADR, gate and guide page, naming the row it fed. Follow the [map](../plan/vivief-inventory/map.md) Notes.

## Answer

77 rows, in [rows/I36.md](../plan/vivief-inventory/rows/I36.md), with a coverage line for each of the 101 glossary terms, D1-D94 (the two unanswered questions 4 and 5 share one line), ADR-0001 to ADR-0031 with the README and template, P01-P17 and the ten guide pages. Most rows join a glossary group, its decision, its ADR and its gate: 35 are `verified` (P01-P11 have ledger passes), 23 `implemented` (checked by `verify`, no gate), 8 `proposed` (on ADR-0001, 0002, 0023, 0026, 0027 and ADR-0013's P17 part) and 11 `accepted` (a decision, term or freeze only, including the ideas of P12-P14, which have no ledger entry).
Ambiguities: Drain before close has no decision, ADR or gate; Tamper-evidence names an absence; the Identity terms and the four span terms come from the P11 grilling and P10 picks (ADR-0022, ADR-0018), not from numbered decisions. Patterns and principles with no glossary term: telemetry sink, sync, links and routing, UI on every platform, quarantine, never rename or migrate, data at rest, research record, issue. For the four primed decisions, the log keeps only the refined answer, not the first one. The ADR README still says "D1-D58", and ADR-0001's Observed predates the 26 Qualified ADRs.

## Comments
