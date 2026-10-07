# I47: What ViViEfs is about

Status: resolved

Category: enhancement

Effort: docs/plan/foundation-concepts/

Type: grilling

Found: 2026-10-07

## What

What is ViViEfs about beyond what it builds: creation, as in vivief; the proposed "creation and communication, with teaching, using learning as the verification" of [I34](0034-vivief-as-the-source-of-viviefs-concepts.md); or something narrower that fits a reference stack? The answer rewrites the plain sentence of the glossary's ViViEfs entry and opens the foundation ADR that [I55](0055-accept-the-foundation-concepts.md) accepts. It also decides whether "the same loop at every scale" names ViViEfs's own loops (verify per change, a gate per claim, a guide per pattern), what Vision, View and Effects mean in ViViEfs's own name, and whether teaching verifies at all; what counts as evidence that it does is map 4's.

Settle each row below with one disposition (adopt, keep ours, reject, defer with a `Decide when:`, hand to map N, or stands) and list them in the Answer; record decisions in the decision log, numbered on from D94, an ADR where the decision is architectural, and a glossary entry for each concept adopted (a word that clashes waits for map 3). Consequences become issues or Schedule entries. Follow the [map](../plan/foundation-concepts/map.md) Notes; the rows' citations are in [the vivief inventory](../research/2026-10-06-vivief-inventory.md).

Rows (9): `vivief:creation`, `vivief:fractal-factory`, `vivief:three-pipelines`, `vivief:vision-view-loop`, `viviefs:reference-stack`, `vivief:anti-goals`, `vivief:observation-apart-from-meaning`, `vivief:effects-over-actions`, `viviefs:changeset`.

## Answer

Decided with the human on 2026-10-07. ViViEfs is about **app creation**: people and AI agents building apps, and the proven parts later apps are built from, in one language both read the same way; using a part in a real app is how it gets better. What it builds stays the reference stack (ADR-0002). The decisions are D95-D102 and D55'; [ADR-0032](../adr/0032-what-viviefs-is-about.md) states them and opens the foundation ADR that I55 accepts. The glossary's ViViEfs entry is rewritten without a device or topology, and App creation is added.

| Row | Disposition |
| --- | --- |
| `vivief:creation` | adopt, as App creation (D95); vivief's broader `Creation` is not adopted |
| `vivief:fractal-factory` | defer, `Decide when:` I56 |
| `vivief:three-pipelines` | adopt the language types, reject the pipelines (D97); names to map 3, views to map 5 |
| `vivief:vision-view-loop` | adopt our reading (D98); the entries for Vision, View and Effects to map 3 |
| `viviefs:reference-stack` | stands, as what ViViEfs builds; the glossary entry rewritten |
| `vivief:anti-goals` | keep ours: out of scope means not yet (D100); vivief's "anti-goals" framing rejected |
| `vivief:observation-apart-from-meaning` | adopt as a principle (D99); the analysis of ViViEfs's own code to map 5 |
| `vivief:effects-over-actions` | stands (D36, P06, P09); cited in ADR-0032 |
| `viviefs:changeset` | defer, `Decide when:` I56 |

- **Teaching verifies the language** (D96). Gates verify what we built; a learner who cannot build from what we wrote is a finding against the writing. What counts as the evidence stays map 4's.
- **One shape at every level** is [I56](0056-one-shape-at-every-level.md), with the human's framing of the `effectHandler`; it blocks I51 and I55.
- **Not closing doors** (D100): [I57](0057-out-of-scope-items-in-adr-trade-offs.md) adds the question to the ADR template's Trade-offs.
- **Lab and production** (D101): several servers in the lab is [I58](0058-several-servers-in-the-lab.md); engine scale-out is I8, which gains the trigger.
- **The consumer apps live here** (D55'): I9 is resolved; their shape and what an app is to a device and a node moved into I48, with the client-server-as-signed-peer framing.
- **Tools are apps** (D102), raised by the human on review: a tool is an app for the people and agents building apps, often a CLI; D52's `tools/` stays the project kind. The Tool entry is map 3's. DevAC's 23 rows go to map 5 as candidates (comment on I34), and I48 answers what an app is to a device and a node for tools too.
- **ADR-0002 and the vision page** follow in [I59](0059-bring-adr-0002-and-the-vision-in-line-with-i47.md).
- **Inputs for maps 3 and 5** are a comment on I34.

## Comments
