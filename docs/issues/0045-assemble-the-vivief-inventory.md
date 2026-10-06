# I45: Assemble the vivief inventory

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: task

Blocked by: I37, I38, I39, I40, I41, I42, I43, I44

Found: 2026-10-05

Claimed: 2026-10-06

## What

Is the inventory complete and correct enough to review? Assemble `docs/plan/vivief-inventory/rows/I35.md` to `I44.md` into the research record `docs/research/<date>-vivief-inventory.md` and its HTML view `docs/research/<date>-vivief-inventory.html`, with a row in `docs/research/README.md`.

- Merge rows that name one idea twice; keep the index ids.
- Fill the vivief side of I36's rows from the slices; rows still empty there become `ViViEfs only` with the nearest vivief idea.
- Check every `verified` against `tools/qualification/gate-ledger.json`, and every `deferred` and `rejected` against the ViViEfs source it cites.
- Check both coverage lists: every in-scope vivief file and every ViViEfs source has a line.
- Add an `Apps` column: for each reference-stack row, the candidate consumer apps (BirVana, ERP, GRC, counseling, procurement, retail; [I9](0009-product-apps-as-app-pairs.md) Comments) that need the idea, with the source that says so, or `-`. An app's need is the proof that a pattern is useful. The rows files stay as written; the column lives only in the record. Whether an app needs ideas or features is open (the fog on the map): use the row's idea as the unit for now and say so in the record.
- Decide the HTML layout (by concept, by map or by status), the fog on the [map](../plan/vivief-inventory/map.md).

Record what was merged and what the checks found in the answer.

## Answer

[The vivief inventory](../research/2026-10-06-vivief-inventory.md), with its [HTML view](../research/2026-10-06-vivief-inventory.html) and a row in the research README: 348 rows from the slices' 485, 191 `different`, 94 `missing`, 14 `deferred`, 4 `rejected`, 33 `taken`, 12 `ViViEfs only`; 319 reference stack (map 2 100, map 3 16, map 4 61, map 5 55, map 6 87), 6 product vision, 23 DevAC tooling. Complete enough to review: every source has a coverage line, and the checks found two citation faults and one weak citation, none of which changes a status.

Merged. The 89 ids that several slices wrote became one row each. 19 pairs of ids became one row keeping both ids: 18 where a vivief row and a ViViEfs row are the same comparison written from each side (`vivief:datom` with `viviefs:datom`, `vivief:effect-handler` with `viviefs:command`, `vivief:adr` with `viviefs:adr-lifecycle` and 15 more), and `vivief:rule-proposal` with `vivief:proactive-review-trigger`, one mechanism named twice. The slices' other sixty-odd "possible merges" join related but distinct ideas and stay apart; nothing was split. Thirteen status conflicts were settled, each with its reason in the record: an idea ViViEfs practises unnamed is `different`, not `missing`, where its ViViEfs cell cites the practice (the rule I37, I38, I39 and I41 asked for); `vivief:domain` is `deferred` on I9; the three peer-to-peer rows are `deferred`, one status per id. Levels take the highest the evidence supports, a merged pair its ViViEfs row's level.

The ViViEfs side. Seven I36 rows got their vivief side from the slices and 17 more through a merge. I45 matched the other 53 to the slice rows whose ViViEfs cells cite the same decisions, ADRs and glossary terms: 40 `different`, 1 `taken` and only 12 `ViViEfs only`, since most have a vivief idea in the same area. Those 53 are I45's judgement and worth a look in I46; eight of them took their map from their nearest vivief rows.

Checks. Every `verified` level names P01-P11, each with a clean pass as its latest ledger entry (2026-10-02); none claims P12-P17. Every `deferred` and `rejected` source exists and says what is quoted, except that I38 misquotes D48' (the record uses I41's wording); the five peer-to-peer deferrals rest only on the 2026-09-30 communication research, with no open item or `Decide when:`, a gap map 2 inherits. I36 cites `D4/D5`, which the decision log keeps as one row recording that no decision was made (replaced by D11 and D12); the record writes it in code font. Coverage: all 207 in-scope vivief files have a line except the three generated LikeC4 files in `fact/c4/generated/`, a placeholder with nothing extracted, now covered in the record; I36 covers all 101 glossary terms, the 93 decision rows, 31 ADRs, 17 gates and the guide. 40 reference-stack rows ask no question (39 of them I36 rows); the record lists them for the maps.

Apps. 36 reference-stack rows name an app: counseling 23 and procurement 11, from vivief's own product contracts; GRC 5, ERP 4 and BirVana 2, from D18, D34, D50, ADR-0009, ADR-0010, ADR-0022, the exemplar's GRC flavour, the communication research and the BirVana inputs. No source says what retail needs. The unit is the row's idea, as the record says.

Layout: by map. The record and its view exist for maps 2-6 and for I46, which walks them map by map; status and app are filters, and a map-by-status matrix opens each cell.

Along the way: the docs build rejected `D35''` after a code span, because smartypants curls it into `D35’‘` before the reference linker runs. The linker now reads `‘` as a prime too (`apps/docs/src/lib/references.ts`, with a test).

## Comments
