# I54: Trust, encryption and who may sign in

Status: ready-for-human

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Blocked by: I47, I49

Found: 2026-10-07

## What

Does encryption in ViViEfs serve access and consent, as vivief's `Trust Contract` does, or only erasure and data at rest, and is access part of each read or a server check around sync and commands? With it, the rows I46 moved here from map 6: sign-in through OIDC, the organization as the isolation unit and its membership, devices and their local replicas, keys that authenticate a device apart from membership, and integrity by hashing the log (I15).

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from D94, an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (10): `vivief:trust-contract`, `vivief:projection-access`, `vivief:selective-value-encryption`, `viviefs:crypto-shredding`, `viviefs:data-at-rest`, `viviefs:identity-pattern`, `viviefs:organization-isolation-and-membership`, `viviefs:device-and-local-replica`, `vivief:transport-identity-apart-from-authorization`, `viviefs:tamper-evidence`.

## Comments
