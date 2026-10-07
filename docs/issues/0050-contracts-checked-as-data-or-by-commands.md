# I50: Contracts checked as data or by commands

Status: ready-for-human

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: I47, I52

Found: 2026-10-07

## What

Do commands, Schema at every boundary and server revalidation cover what ViViEfs's contracts promise, or does the stack need what vivief checks as data at run time: contracts as datoms on every effect, kinds of contract (guard, state machine, aggregation), checks after commit with recorded findings, and the Schema itself as facts in the log? The vivief word `Contract` clashes with ViViEfs's Contract; this ticket decides meaning, map 3 the word.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from D94, an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (17): `vivief:contract-governed-handler`, `vivief:contract-runtime-needs`, `vivief:runtime-contract-enforcement`, `vivief:schema-contract`, `vivief:schema-evolution`, `vivief:temporal-validation-points`, `vivief:behavior-contract`, `vivief:contract-modes`, `vivief:contract-subtypes`, `vivief:self-describing-datoms`, `viviefs:schema-at-every-boundary`, `vivief:typescript-for-contracts`, `vivief:bridge`, `vivief:intake`, `vivief:asserted-versus-inferred`, `vivief:protocol-version-negotiation`, `vivief:live-evolution`.

## Comments
