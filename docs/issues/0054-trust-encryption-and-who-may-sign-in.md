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

2026-10-08: [I49](0049-projection-one-concept-or-several-patterns.md) leaves inputs here. **Access** stays outside the read: a replica only receives what its account may see, so a Presenter carries no access rule (D107); if I12 lets a replica hold data its reader may not see, access returns to the read. **Erasure** reaches intermediate presentations (indexes, Parquet, embeddings, caches): ciphertext, or rebuilt when a subject is erased (D112). **Redaction** (`vivief:redaction`, an attribute read for computation but never shown) is deferred, `Decide when:` an app has an attribute something computes on that no screen may show; in a Presenter it would be a frame column marked compute-only. **Trust** in data is [ADR-0034](../adr/0034-origin-trust.md) (origin trust, D115-D117); vivief's Trust Contract (keys, roles, consent) is encryption and stays here.

2026-10-08: [I52](0052-the-datom-and-its-store.md) adds the **blind index** (D122). A personal external identifier, such as a national id, is a personal attribute, so it is encrypted per subject and cannot be searched: each person's values use a different key, and the same value encrypts to different bytes each time. Looking one up by value needs a keyed hash of the plain value beside it, made with a secret key, so the same value always gives the same hash. Because a national id has few possible values, anyone holding the hash key can hash them all and reverse the index, so the index must go when the person is erased: it is a read model built from decrypted values on a `node` that holds the keys, and cannot be rebuilt once the person's key is destroyed (D112). Deferred, `Decide when:` an app looks up a personal external identifier by value.
