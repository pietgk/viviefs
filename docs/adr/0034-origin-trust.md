# ADR-0034: Origin trust

Summary: Trust belongs to the origin a fact came from, not to the fact: derived when read, follows lineage, and withdrawn from an origin all at once.

Status: Proposed, unverified

Date: 2026-10-08

Qualifying gate: named when it is built (I64), no later than the first
enriching implementation (D111), which cannot ship without an origin.

Related: D115, D116, D117, D58'. ADR-0033 (the Presenter pattern), ADR-0008
(the envelope), ADR-0023 (crypto-shredding, the model this follows),
ADR-0032 (foundation concepts). Opened by I49; I64 (build), I15 (envelope
signing), I16 (roles), I51 (agents as actors), I54 (encryption).

## Problem

vivief invested in trust: every transaction carries `:tx/source` (a category
such as `:human` or `:ai/text-generation`) and `:tx/trust-score`, set at
ingestion from a default per actor type; derived content gets the least trust
of its inputs; a Projection filters by `trustThreshold`; a Surface shows trust
signals; and three trust strategies decide how an actor's work is committed.
ViViEfs's envelope (D58) names the actor, a person or the server, and nothing
about where content came from. Once enriching implementations bring in mail,
chat, web pages and model output (ADR-0033), a screen or an agent's context
must be able to tell a person's words from a scraped page, and an organization
must be able to withdraw trust from a source that proves wrong.

## Design

**Trust belongs to an origin (D115).** Every changeset names its origin in the
envelope (D58'): a reference to an origin entity, a person, a mail account or
chat workspace, a website, a model and its version, a system activity. It is
apart from the actor who committed it. An enriching changeset also names its
inputs' origins. Trust in an origin is datoms on the origin entity, so its
history is kept. A value's trust is derived when read: the least trusted of
its origin and its inputs' origins, a default policy that can be replaced. A
person's review of a changeset raises that changeset, never the origin, to the
reviewer's level. Lowering trust in one origin lowers everything it produced,
the way destroying one key erases one person (ADR-0023); but erasure is
enforced by cryptography and trust only by Presenters, so a Presenter must
apply it.

**In a Presenter (D115).** A frame carries each value's origin and derived
trust as companion columns when the query asks; a threshold is a filter in the
query; the trust context defaults to no filter. Trust is per value, because
one entity can mix a person's title and a model's summary.

**Levels and who sets them (D116).**

| Level | Meaning |
| --- | --- |
| `verified` | Checked by something deterministic: a gate, a validation, an exact source. |
| `trusted` | A person, or an origin the organization trusts. |
| `unreviewed` | Model output or gathered content nobody has checked. |
| `untrusted` | Kept, but left out of an agent's context by default. |
| `revoked` | The organization withdrew trust; shown only to a reviewer. |

Trust is per organization. Defaults per kind of origin live in the app's
catalog; an override is a datom on the origin entity that only authority
writes (`authority: 'server'`), until roles (I16) loosen it.

**Trust strategies as commit paths (D117).** An enriching implementation's
origin level chooses its path: authoritative commits directly; sandboxed keeps
the output an open changeset seen only in its author's draft view (D35'',
D42); gated adds a durable deferred asking a person to commit it (D11, D40).

vivief's `:tx/source` maps to the origin; its `:tx/trust-score` fixed at
ingestion is not adopted. vivief's Trust Contract (keys, roles, consent) is
encryption and stays with I54.

Revisit when a consumer app needs trust finer than five levels, or when the
`min` rule hides a value a reviewer needs.

## Trade-offs

- **A score fixed at ingestion** (vivief) cannot be withdrawn without
  rewriting history, and says nothing when a source later proves wrong.
- **Trust on each datom** costs a field per fact; one origin per changeset
  fits, because gathering commits per batch per origin.
- **Numbers (0.0-1.0)** suggest a precision nobody can defend; levels keep the
  `min` rule.
- **Any member sets trust**: lowering an origin's trust changes what every
  agent and screen sees, closer to granting membership than to editing a
  title.
- **Out-of-scope items (D100, I57).** Authority writes trust overrides; under
  D105 (1) that is a duty a `node` holds, not a server process. Signed origins
  fit the envelope without changing datoms (D105 (5), I15).

## Failure-handling

- An enriching implementation without an origin does not ship (I64).
- A derived value whose inputs' origins were not recorded cannot have its
  trust derived; it is treated as `unreviewed` and the gap is a finding.
- No gate checks this record yet; it is intent until I64 names its gate.

## Outcome

### Expected

Withdrawing trust from one origin changes the trust of every value it
produced, and of every value derived from them, in every frame that asks for
trust, with no change to the log.

### Observed

Not yet run.
