# I30: Ideas batch: glossary entries written as effects

Status: ready-for-human

Category: enhancement

Decide when: [I21 Test the glossary with a reader outside software][I21]'s reader test shows a newcomer needs what a term takes in and gives out, or a guide needs a term's deterministic and reasoning parts

Found: 2026-10-04

Series: ideas-batch, fourth batch: `ideas-batch-glossary-entries-written-as-effects`

## What

Give each glossary term a fourth form next to its name, its one plain sentence and its paragraph: a description written as effects at a high or super-high level, which a human engineer and an LLM read the same way, and which shows what part of the term can be built deterministically and where reasoning is needed. It starts from vivief's formula, everything is an effect, `(State, Effect) => (State', [Effects'])`, whose names we have not settled yet (`State`, `Context`, `Effect`, `Intent`, `Command`). It overlaps with [I29 Ideas batch: agents that record a replayable run][I29]: test specs written in glossary terms that an agent runs and records as deterministic tests. This issue does not decide anything.

## Start from vivief's concepts quick reference

vivief's [DevAC concepts quick reference](https://github.com/pietgk/vivief/blob/main/docs/contract/concepts-quick-ref.md) is close to what this issue looks for, and belongs at the front of the discussion. In one page of about 300 lines it has:

- **The thesis first**: the formula, "deterministic-first", and what effects documentation means, before any term.
- **A division of labour**: the system watches, validates and caches (deterministic); the LLM queries, reasons and proposes; the human decides, edits and approves. "Ask if the answer can be determined deterministically."
- **A glossary grouped by context**: `Core`, `Architecture`, `Workflow`, `Status`, `Actor` and `UI Effect` terms, so a term is read inside its group.
- **Names that carry their context**: `Code Diagnostics`, `Work Activity`, `Effect Telemetry` ("runtime observation converted to effect format for comparison with static analysis", the idea of [I25 Ideas batch: understanding and maintaining code bases][I25]), `A11y Edge`, `UI Effect` ([I26 Glossary links on words that are not our terms][I26] takes this up as a way to prevent clashes).
- **Deprecated terms**: each old word, what to use instead, and why (`Analyser` became `Extractor`, "clearer: it extracts data into seeds"). Our glossary has an Avoid list per term, without the reason or the history.

## The formula and its names

vivief wrote one formula for every state transition, and this repo has said it three ways so far:

| Where | Written as |
| --- | --- |
| vivief's foundation | `effectHandler = (state, intent) => (state', [intent'])` |
| [I25 Ideas batch: understanding and maintaining code bases][I25] | `(Context, Intent) => (Context', [Effects])` |
| This idea | `(State, Effect) => (State', [Effects'])` |
| `GLOSSARY.md`, Command ([D36 Shared commands][D36]) | `(readModel, intent) -> changeset or DomainError` |

The names do not agree yet, and some already mean something else here:

- `Effect` in the glossary is the TypeScript library. vivief's effect is data: a description of something that happens or is asked for. One of the two needs another name, or the glossary needs to say which one a page means.
- `Intent` is "what the user asked for, before it is checked", the input to a command. In vivief's formula the input can be any effect, not only a user's.
- `State` and `Context` are not glossary terms here. In vivief's [foundation glossary](https://github.com/pietgk/vivief/blob/main/docs/contract/foundation.md#12-glossary) they are, with other meanings than the formula's: `Context` is "the set of repos/worktrees relevant to current work" and `State` the "current snapshot of the system". So vivief itself used `Context` for two things.
- Here, the command's state is a read model, and the command does not return a new one: it returns a changeset, and the new read model follows when the changeset is applied and projected. Whether the formula's `State'` is the changeset, the read model after projection, or the log, is part of the naming question.
- `Command` already is the formula in this stack's words, for one kind of change.

vivief also grouped effects by level ([foundation](https://github.com/pietgk/vivief/blob/main/docs/contract/foundation.md#55-effect-hierarchies), section 5.5): low-level effects at a boundary (a database query, an HTTP request), high-level effects composed from them by rules (charge a payment, authenticate a user), and actor-level effects (state machines). "Super high" is not one of vivief's levels; it is new here, and what it means is a question below.

## What a glossary entry has today

[D94 A glossary a newcomer can read][D94] gave every entry the same shape:

1. The **name**, in bold, which the docs site links on its first use on a page.
2. **One plain sentence** that someone outside software understands; it is what a hover shows.
3. **A paragraph** with the precise meaning, in which other terms are linked again.
4. Optionally an **Avoid** list of words that are not the term.

## The proposal: a fourth form, written as effects

Each entry could get a short description in effect form: what goes in, what comes out, which effects it produces, at which level, which parts are deterministic and which need reasoning. Two sketches to react to, not a syntax:

```text
Command  (high)
  (readModel, intent) => changeset | DomainError
  deterministic: the Schema check, membership, invariants
                 (independent review, lease fencing)
  reasoning:     none
  then:          the changeset is applied and projected;
                 the read model changes there, not here
```

```text
IntentComposer  (super high?)
  (screen, input) => (screen', [intent])
  deterministic: composing, reviewing and submitting as a machine;
                 the checks a command repeats
  reasoning:     the user decides what to ask for;
                 nothing in the machine decides it
```

What this could give:

- **One reading for people and models.** The plain sentence is for a newcomer; the effect form is for an engineer and an LLM, and leaves less room to read a name differently.
- **A test of the name.** If a term cannot be written as effects, or its effect form needs reasoning nobody named, the name may not mean one thing yet. The fog around `State`, `Context` and `Effect` above is that test failing today.
- **The deterministic part is visible.** The effect form says what code can do and states the reasoning part explicitly, like vivief's two worlds and its deterministic-first path ([I25 Ideas batch: understanding and maintaining code bases][I25]).
- **Checkable.** An effect form names inputs and outputs that exist in code (Schema types, services, commands), so `verify` could check that they exist, the way it checks references ([D87 References resolved when rendered][D87]) and guide shapes.

## Where it overlaps

- **[I29 Ideas batch: agents that record a replayable run][I29].** A high-level test spec says goals in plain words; an agent runs it and records the actions as a deterministic test, which runs fast and without a model until it fails, and a new agent run then updates it. If the test spec uses glossary terms, and each term has an effect form, the spec says less that is ambiguous, the agent has a better model of the app, and the recorded test can be checked against the effects the terms promise.
- **[I26 Glossary links on words that are not our terms][I26].** Names that clash with outside code, docs, lessons and other projects (`Effect`, `Worker`, `Stage`, `workflow`, `cursor`). An effect form makes our sense of a term explicit, which is what a reader needs when the same word means something else nearby.
- **[I25 Ideas batch: understanding and maintaining code bases][I25].** Its entry concept is design from code, truth from OTel. High-level effects are what vivief lifted from code with rules and drew as C4 views; an effect form per term could be the vocabulary of the design model and of the live picture.
- **[I28 Alchemy: infrastructure as Effects][I28].** Another project whose names clash with ours, and which describes infrastructure as Effect programs.
- **[I21 Test the glossary with a reader outside software][I21].** The plain sentence is tested with a reader outside software; the effect form could be tested with an engineer and an LLM.

## Questions for the brainstorm

- Does `GLOSSARY.md` take the quick reference's shape: the thesis first, terms grouped by context, names that carry their context, and a table of replaced terms with the reason?
- What are the names in the formula: `State` or `Context`, `Effect` or `Intent`, and which word stays for the TypeScript library? Does the formula become a glossary term itself?
- What do the levels mean here: low, high, actor-level, and is "super high" a user goal or a whole flow, the level a test spec is written at?
- What is the notation: plain text like the sketches, TypeScript types, an Effect Schema, or a small DSL that `verify` can parse? Does it live in `GLOSSARY.md` or next to the code it names?
- Which terms get an effect form: every term, or only those that are something the system does (Command, IntentComposer, Workflow, Activity, Projector), and not those that are a thing or a rule (Datom, Layer, Gate)?
- How is an effect form checked: that its inputs and outputs exist in code, that its deterministic part has tests, that its reasoning part is named where an agent or a human decides?
- How do test specs ([I29 Ideas batch: agents that record a replayable run][I29]) use it: written only in glossary terms, checked for unknown terms like [D87 References resolved when rendered][D87] checks unknown ids?

## Comments

2026-10-09: Triaged with the human ([2026-10-09 Phase 0](../research/2026-10-09-phase-0-review.html), the sequence in [next-session](../plan/next-session.md)): its home is an input to [I56 One shape at every level?][I56], then map 3 (the formula's names).

2026-10-24: [I56 One shape at every level?][I56] settled where the shape is foundation: the data level, where a command decides, authority accepts and the projector evolves, a workflow runs over its journal, and activities are the only door to the world ([D130 One shape at the data level][D130]). An effect form fits the terms that are steps over kept state (Command, Projector, Workflow, Activity, IntentComposer, and accepting), not reads or things (Datom, Read model, Gate). The changeset is the step, and `State'` is the log after accept ([D131 The changeset is the step][D131]). The sketch's "super high" level is the lens, the same four states at every level ([D132 Four states at every level][D132]), not a handler. What is left is the formula's names, which are map 3's, after [I78 Research: Effect's vocabulary against ours][I78] compares Effect's vocabulary with ours ([D135 Effect's names first][D135]).

2026-10-27: map 3 started. The formula's names are decided in [I88 Effect and the effect handler][I88] Effect and the effect handler, which comments here on what is left.

2026-10-28: narrowed by [I88 Effect and the effect handler][I88]. The formula's names are answered: there is no formula with names of its own; the effect handler's sentence is the formula and each handler keeps its signature in its own terms ([D166 No formula with names of its own][D166]). Which sense the word effect takes is answered: one meaning, named by phase ([D163 One meaning of effect, named by phase][D163]). What is left is this issue's own idea, a fourth form per glossary entry (what it takes in and gives out, which parts are deterministic and which need reasoning); it waits for evidence that a reader needs it. vivief's deprecated terms with a reason went to [I89 How a word is chosen and written][I89]; the glossary's groups are already that ticket's, and the "super high" level is [D132 Four states at every level][D132]'s levels.

2026-10-28: from [I89 How a word is chosen and written][I89]. Its "Avoid with a reason" is answered: a word we used and retired names, on its Avoid line, the decision that retired it, and that row holds the reason ([D175 A retired word names its decision][D175]). The glossary's groups now follow the one turn ([D177 Groups follow the one turn][D177]). An entry now ends with labelled `_Like_`, `_Not_` and `_Avoid_` lines ([D174 Like, Not and Avoid lines][D174]); a fourth form, if a reader needs it, would be one more label. What is left is unchanged: the fourth form waits for evidence from [I21 Test the glossary with a reader outside software][I21].

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D130]: ../plan/bootstrap/02-decision-log.md#d130
[D131]: ../plan/bootstrap/02-decision-log.md#d131
[D132]: ../plan/bootstrap/02-decision-log.md#d132
[D135]: ../plan/bootstrap/02-decision-log.md#d135
[D163]: ../plan/bootstrap/02-decision-log.md#d163
[D166]: ../plan/bootstrap/02-decision-log.md#d166
[D174]: ../plan/bootstrap/02-decision-log.md#d174
[D175]: ../plan/bootstrap/02-decision-log.md#d175
[D177]: ../plan/bootstrap/02-decision-log.md#d177
[D36]: ../plan/bootstrap/02-decision-log.md#d36
[D87]: ../plan/bootstrap/02-decision-log.md#d87
[D94]: ../plan/bootstrap/02-decision-log.md#d94
[I21]: 0021-test-the-glossary-with-a-reader.md
[I25]: 0025-ideas-batch-understanding-and-maintaining-code-bases.md
[I26]: 0026-glossary-links-on-words-that-are-not-our-terms.md
[I28]: 0028-alchemy-infrastructure-as-effects.md
[I29]: 0029-ideas-batch-agents-that-record-a-replayable-run.md
[I56]: 0056-one-shape-at-every-level.md
[I78]: 0078-research-effect-vocabulary-against-ours.md
[I88]: 0088-effect-and-the-effect-handler.md
[I89]: 0089-how-a-word-is-chosen-and-written.md
