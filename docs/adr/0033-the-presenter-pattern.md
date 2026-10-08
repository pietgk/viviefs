# ADR-0033: The Presenter pattern

Summary: A screen asks a Presenter for data with a query written as data and keeps a frame subscription to the frame it returns; implementations are faster or enriching, checked against the reference.

Status: Proposed, unverified

Date: 2026-10-08

Qualifying gate: the Presenter conformance gate, to come (I62). P05 and P08
already show the reference implementation.

Related: D107, D108, D109, D110, D111, D112, D113, D114. ADR-0019 (query
atoms, now the reference implementation), ADR-0011 and D37 (the log store and
the analytics projection, now one implementation), ADR-0034 (origin trust),
ADR-0032 (foundation concepts). Opened by I49; I62 (the gate), I63 (the
columnar copy), I12 and I53 (partial sync on demand), I31 (engines).

## Problem

vivief names one concept, `Projection`, for query, access, encryption,
delivery, freshness and trust scope. ViViEfs has each of those it has as a
separate part with its own gate: SQL over read models and the projector (P05),
query atoms with invalidation keys (P05, P08), cursors (P04, P09, P10), the
server's membership check on every pull, push, lease and command (P11), and
encryption for data at rest and erasure (ADR-0023). It had no name for the
whole a screen asks of, and no answer for data a log store cannot hold
quickly: a log that grows large, content from outside (mail, chat, the web,
files), and a model's judgment. "Projection" already means deriving a store
from the log here (the projector, the trace projector, the analytics
projection), the opposite direction from vivief's.

## Design

**The pattern (D107).** A screen asks a Presenter for data with a query and
gets a frame back, to which it keeps a frame subscription. Reads never write.
vivief's `Projection` read side is adopted as this pattern; access and
encryption stay at their boundaries (I54); "projection" keeps its meaning.

```
screen ── query ──► Presenter ──► frame ──► frame subscription
                       │ passed down, each layer answers what it can
                       ▼
          read model ─► log store ─► remote node ─► outside source
                                                    (an enriching activity:
                                                     changesets and blobs)
```

**The query is data (D108).** A typed expression written in code, translated
by each implementation: to SQL for SQLite, Postgres and DuckDB, to Polars, or
to parameters for a remote `node` or an outside source. vivief's L1 idea
(queries in code an LLM can write) is this decision, and its entity operations
(`entity`, `pull` with depth) are part of the vocabulary; an entity with its
children is a frame per level, linked by id. An implementation may be plain
code; it declares that it reads its whole input and filters and sorts
afterwards, so it runs only where that input is held.

**Frame and frame subscription (D109).** Typed rows with each value's origin
(ADR-0034) and the frame's status: fresh, gathering, remote, failed. One
entity is a one-row frame. Freshness is committed, or committed plus my open
changesets (D42). Gathering commits in batches; each batch invalidates the
frame's keys and the frame grows. The frame subscription ends with its screen;
the gathering activity is durable. Cursor consumers stay their own pattern.

**The reference implementation (D110).** Every implementation returns the
reference's frame for the same query at the same `tx`. SQLite read models with
query atoms (ADR-0019) are the reference and today's default. Candidates:
in-memory datom indexes with vivief's entity interface; engines that keep
answers up to date incrementally (`D2TS`, differential dataflow), picked up
when a frame subscription's rerun misses its budget (I63); the columnar copy
(I63).

**Faster and enriching implementations (D111).** Faster ones give exactly the
reference's answer, sooner. Enriching ones add what the log cannot compute
itself, from outside or from a model, by first writing an ordinary changeset
that names its origin and its inputs' origins; from then on a faster
implementation presents it. A result shown but never written says so on its
frame. Analytics (D37) is a faster implementation over the columnar copy.

**Intermediate presentations (D112).** Derived and rebuildable, one
organization only, erasable, gone with the local replica at sign-out.

**Who chooses (D113).** The app builder declares an implementation per
Presenter and swaps it without touching the screen.

**Partial sync on demand (D114).** A Presenter's query can say what a partial
`node` fetches; the facts land in its log and the projector builds the read
model. Built under I12, with I53.

Revisit when a screen needs output finer than a committed batch (D109), when
the reference cannot answer a query a consumer app needs, or when map 5 finds
a screen a frame does not fit.

## Trade-offs

- **vivief's whole `Projection`** puts access, encryption and trust in every
  read. A replica only receives what its account may see (ADR-0022), so a
  check per read protects nothing today; access returns to the read if I12
  lets a replica hold data its reader may not see (I54).
- **vivief's meaning of "projection"** would give the word two meanings, since
  the projector does not make Projections.
- **One engine everywhere** (DuckDB or Polars as the frame): DuckDB on the
  phone is a one-maintainer module and Polars has nothing for it (I31). A
  contract with implementations is the log store's move again.
- **Raw SQL per screen**, as today, cannot be passed past one store.
- **Writing outside content or model output only into a read model** breaks
  D99: a rebuild changes or loses it.
- **Choosing the implementation automatically** from day one is a query
  planner; it can grow out of declared choice, not the reverse.
- **Out-of-scope items (D100, I57).** Partial sync on demand (D114) is D105
  (3) in practice and makes the server-independent mode (I60) no harder.
  Nothing here assumes one server: a Presenter's remote source is any `node`.

## Failure-handling

- An implementation whose frame differs from the reference's for the same
  query at the same `tx` fails the conformance suite (I62) and is not used.
- A frame from an outside source that is unreachable has status `failed` or
  `remote`; it never shows stale data as fresh.
- An enriching result that is not written to the log is marked on its frame.
- No gate checks this record yet; it is intent until I62.

## Outcome

### Expected

The Presenter conformance gate (I62) runs the reference and a second
implementation against one suite and finds the same frames; a frame
subscription reruns only on matching keys, as P05 and P08 already show for
query atoms.

### Observed

Not yet run.
