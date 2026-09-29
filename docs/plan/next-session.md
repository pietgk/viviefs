# Next session: Docs and teaching

## Prompt to start the session

> Read `AGENTS.md`, then `docs/plan/next-session.md` (this file), then
> `docs/plan/bootstrap/05-verify-qualify-teach.md` (Teach), ADR-0026 (amended
> 2026-09-29: a pattern is accepted on its guide), D28, D29 and D57 in
> `docs/plan/bootstrap/02-decision-log.md`, and the Schedule in
> `docs/plan/bootstrap/10-open-items-and-risks.md`. Start Docs and teaching.
> Begin with a grilling on the docs site and the guide template before writing
> either; ask before deviating from an agreed decision and record a deviation
> as an ADR amendment.

## Where things stand (2026-09-29)

- **P01-P11 pass** in one sequential run on a clean tree on `54e724786`
  (run `2026-09-29T09-10-12.066Z-24c082ff`, 30 minutes). P11 is
  closed ([closure note](../evidence/2026-09-28-p01-p11-closure.md)).
- **Housekeeping is done** (this session):

| Item | Commit |
| --- | --- |
| Gates numbered in run order: P12 Quarantine after a lost lease, P13 Encrypted store, P14 Crypto-shredding, P15 Browser engine leader; naming rule (gates in run order, steps as `Pnn.k`, other work by name) in [06-qualification-gates.md](bootstrap/06-qualification-gates.md#names-for-gates-steps-and-other-work) | `6a15d385d` |
| ADR-0026 amended: accepted on the guide; `Taught` merged into `Accepted`; Guide and Guide template in `CONTEXT.md`; the agreed Schedule in the open items | `6a15d385d` |
| ADR-0024, 0025, 0028-0031 qualified with checks that can fail ([`guardrails.test.ts`](../../tools/verify/src/guardrails.test.ts)); lint now refuses imports from `repos/`, and id generation and clock reads in domain code | `1a8e6d342` |
| "Hermes inspector did not appear" explained and removed (RN 0.88 describes every target as `[C++ connection]`) | `9130cd858` |
| Effect language-service suggestions cleared | `66cd9e13c` |
| Android launch race fixed: the other platform's app is stopped by id before navigate, so navigate never mistakes it for this launch (it failed P01 and P02 on Android intermittently); agent-cli calls now carry the Android SDK, without which that stop never worked from an iOS leg | `22915810f`, `54e724786` |
| Upstream issues drafted, not filed: [upstream-issues.md](upstream-issues.md) (the user posts them) | `81ba23d83` |
| This handover; the older handovers point here | the commit that adds this file |

## Decisions for Docs and teaching (agreed 2026-09-29)

- **Scope**: the `apps/docs` skeleton (confirm Starlight; check its licence),
  type-checked samples in `verify`, generated `llms.txt`, the `exercises/`
  layout (the `scaffold-exercises` skill; D57: one Nx project per track,
  `kind:tool`), and a long-term home for the `.lavish/` pages. Then the guides.
- **A guide** is what people and agents use to discuss, design, implement and
  review work with a pattern. A pattern is **accepted** when the user accepts
  its guide (ADR-0026). There is no separate `Taught` status.
- **One guide template**, iterated: drafted together with the log-store guide,
  then tried on durable workflow and identity, which differ from it on
  purpose. When a guide shows the template is wrong, the template changes and
  the guides already written change with it. Later patterns start from the
  template.
- **Acceptance per pattern**, as each guide is reviewed. No ADR is Accepted
  yet.

## Open questions for the grilling

- What a guide contains, and in what order, so that it serves all four uses.
  D29 requires a concept page, an exercise (stub, failing test, reference
  solution passing in `verify`) and a link from the exemplar; lessons cite gate
  evidence and never become the source of a claim.
- Which patterns exist, and which ADRs each guide covers. A starting inventory
  from the qualified ADRs:

| Pattern | ADRs | Gates | Exemplar |
| --- | --- | --- | --- |
| Log store (first, shapes the template) | 0006, 0007, 0011 | P04 | `libs/datom`, the store adapters |
| Changesets and projections | 0008, 0009, 0010 | P05 | `libs/datom` |
| Durable workflow (second) | 0012, 0015 | P06 | `libs/workflow-engine` |
| Device durability | 0013 | P07 | `apps/evidence-mobile` |
| Interaction state and live reads | 0019, 0020 | P05, P08 | `features/evidence/client` |
| Sync | 0014, 0016, 0017, 0021 | P09 | `libs/sync/*` |
| Tracing and telemetry sinks | 0018 | P03, P10 | `libs/telemetry` |
| Identity (third) | 0022 | P11 | `libs/identity`, `libs/testing` |

- Where the guide template lives, and how a template change reaches the
  guides already written (one check in `verify`?).
- Starlight or not; Twoslash or an equivalent for type-checked samples.
- The `.lavish/` pages (P11 teaching pages and the communication-architecture
  research): which become guide material, which stay research.
- `@viviefs/generators` is an empty slot until Docs and teaching (ADR-0024's
  generators are unverified). Is an `exercise` generator needed now?

## After Docs and teaching

P12 Quarantine after a lost lease (grilling, design review, gate), then P13,
P14 and P15. Expo SDK 58 stable (expected October 2026) is its own change with
a sequential P01-P11 run whenever it lands.

## Working notes

- Run Node through mise: `mise exec -- pnpm verify`; `mise exec -- pnpm
  qualify --through P11` for a sequential run on a committed tree.
- Lab facts for any device run are in [p11-next-session.md](p11-next-session.md)
  (steps P11.6 and P11.8).
- A change under `tools/qualification`, `libs/` or `apps/` makes every gate
  stale; batch such changes and end with one sequential run.
