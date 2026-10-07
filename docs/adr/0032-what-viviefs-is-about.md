# ADR-0032: What ViViEfs is about and its foundation concepts

Summary: ViViEfs is about app creation: people and AI agents building apps and their proven parts in one shared language, checked by gates for what we built and by learning for the language.

Status: Proposed, unverified

Date: 2026-10-07

Qualifying gate: none (intent). Each foundation concept map 2 adopts cites the
gate that already shows it, or names the gate to come.

Related: D95, D96, D97, D98, D99, D100, D101, D102, D55'. ADR-0002 (what ViViEfs
builds), ADR-0026 (Verify - Qualify - Teach), D93 (claims). Opened by I47;
completed by I48-I54 and I56; accepted in I55.
[The foundation concepts map](../plan/foundation-concepts/map.md).

## Problem

ADR-0002 and D1 say what ViViEfs builds: a reference stack for an app and its
server, AI-robust, proven once so later apps copy it. They do not say what
ViViEfs is about. vivief, its predecessor in spirit, answered that with
`Creation`: humans, AI and systems all create through one loop. The human's
proposal in I34 was narrower and different: creation and communication, with
teaching, using learning as the verification of what we create, proving that
the languages between humans and agents work. Without an answer, the foundation
concepts map 2 decides (I49-I56) have nothing to be chosen against, and the
name Vision - View - Effects has no meaning.

## Design

**What ViViEfs is about (D95).** App creation: people and AI agents building
apps, and the proven parts later apps are built from, in one language both read
the same way. Using a part in a real app is how it gets better, so the consumer
apps live in this repository too (D55'). The tools apps are built with
(`verify`, `qualify`, the generators, `exercise`) are apps too, whose users are
the people and agents building apps (D102); D52's `tools/` still says where
they live and that nothing imports them. What ViViEfs builds stays the
reference stack and its repository (ADR-0002). vivief's broader `Creation` is
not adopted. The words name no device or topology; what an app is to a device
and a node is I48's.

**Two verifications (D96).** A gate verifies a claim about what we built (D93).
Learning verifies the language we wrote it in. A learner, person or agent, who
cannot build from what we wrote is a finding against the writing, recorded and
fixed like a failed gate. Learning never becomes the source of a claim. What
counts as the evidence is map 4's.

**Our languages (D97).** The languages learning verifies, by type:

| Type | ViViEfs's languages | Written by | Read by |
| --- | --- | --- | --- |
| Natural | Plain glossary sentences, lessons, concept pages | People and agents | Anyone, including readers outside software |
| Structured | Decisions, ADRs, claims, issues | The human with an agent, in a grilling or review | People and agents before they work |
| Compiled | Schema, types, code, `verify` checks, gates | Agents and people | The compiler, `verify`, `qualify`, agents |
| Presentation | The docs site, claims pages, diagrams, review pages | Generated from the other three | People |

vivief's language types are adopted; its three pipelines are not. The names
are map 3's, the views map 5's.

**Vision - View - Effects (D98).** The name is a loop. `Vision` is what we
intend and decide (decisions, ADRs, claims). `Effects` is what actually happens
(the log, evidence notes, traces). `View` is what a person or agent sees and
learns from (guides, diagrams, the app's screens). One turn: intend, build,
observe what happened, show it, check it against the intent. A gate is one turn
(claim, run, evidence, claims page); a guide is another (decision, exemplar,
evidence, a lesson a learner tries). Whether one shape describes every level is
I56's.

**Facts kept, meaning derived (D99).** What happened is kept; what it means is
derived and replaceable. The log holds what commands wrote; read models are
derived, disposable and rebuilt (ADR-0006, D37), shown by P05's rebuild check.
A command returns a changeset instead of writing (D36), and activity results
are journaled and replayed (D2, P06, P09).

**Out of scope means not yet (D100, D101).** Everything out of scope is out for
now, never ruled out. Each item says what must stay possible, and every ADR says
which out-of-scope items it makes harder (I57). Some items can be qualified in
the lab, for learning, without being production: several servers (I58) and
engine scale-out (I8). Client-server read as peer-to-peer with server-signed
nodes is the case to protect (I48).

**Foundation concepts.** Which of vivief's concepts become ViViEfs's
foundation is decided by I48-I54 and I56 and recorded here; I55 accepts the
whole.

Revisit when a learner's failure shows the languages above are not the ones
people and agents actually use, or when I56 finds one shape that describes
every level.

## Trade-offs

- **vivief's `Creation`** would cover everything humans, AI and systems make,
  including a counseling session. It brings vivief's product scope with it and
  would leave "creation" no everyday meaning. App creation is narrower and says
  what ViViEfs does.
- **A reference stack only** (no meta insight) leaves teaching as a delivery
  rule without saying what it checks, and gives the concept tickets nothing to
  choose against.
- **Learning as a verification of what we built** would let a lesson stand in
  for a gate. Gates stay the only proof of a claim (D93), the same line D68
  draws for research records.
- **Amending ADR-0002** instead of a new record would mix scope and the exemplar
  with eight tickets of concept decisions; ADR-0002 keeps what ViViEfs builds.

## Failure-handling

- A learner who cannot build from a guide is recorded as a finding against the
  guide or glossary, not closed as the learner's mistake (D96). Map 4 decides
  how that finding is collected.
- A decision that makes an out-of-scope item harder without saying so is a
  review finding once I57 adds the Trade-offs line.
- No gate checks this record; it is intent until I55.

## Outcome

### Expected

Every concept ticket of map 2 decides against this record, and I55 accepts it
with the foundation concepts filled in. The glossary's ViViEfs and App creation
entries match it.

### Observed

Not yet run.
