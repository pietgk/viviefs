# I45: Assemble the vivief inventory

Status: ready-for-agent

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: task

Blocked by: I37, I38, I39, I40, I41, I42, I43, I44

Found: 2026-10-05

## What

Is the inventory complete and correct enough to review? Assemble `docs/plan/vivief-inventory/rows/I35.md` to `I44.md` into the research record `docs/research/<date>-vivief-inventory.md` and its HTML view `docs/research/<date>-vivief-inventory.html`, with a row in `docs/research/README.md`.

- Merge rows that name one idea twice; keep the index ids.
- Fill the vivief side of I36's rows from the slices; rows still empty there become `ViViEfs only` with the nearest vivief idea.
- Check every `verified` against `tools/qualification/gate-ledger.json`, and every `deferred` and `rejected` against the ViViEfs source it cites.
- Check both coverage lists: every in-scope vivief file and every ViViEfs source has a line.
- Add an `Apps` column: for each reference-stack row, the candidate consumer apps (BirVana, ERP, GRC, counseling, procurement, retail; [I9](0009-product-apps-as-app-pairs.md) Comments) that need the idea, with the source that says so, or `-`. An app's need is the proof that a pattern is useful. The rows files stay as written; the column lives only in the record. Whether an app needs ideas or features is open (the fog on the map): use the row's idea as the unit for now and say so in the record.
- Decide the HTML layout (by concept, by map or by status), the fog on the [map](../plan/vivief-inventory/map.md).

Record what was merged and what the checks found in the answer.

## Comments
