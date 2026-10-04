# I30: Ideas batch: glossary entries written as effects

Status: needs-triage

Category: enhancement

Found: 2026-10-04

Series: ideas-batch, fourth batch: `ideas-batch-glossary-entries-written-as-effects`

## What

Give each glossary term a fourth form next to its name, its one plain sentence and its paragraph: a description written as effects at a high or super-high level, which a human engineer and an LLM read the same way, and which shows what part of the term can be built deterministically and where reasoning is needed. It starts from vivief's formula, everything is an effect, `(State, Effect) => (State', [Effects'])`, whose names we have not settled yet (`State`, `Context`, `Effect`, `Intent`, `Command`). It overlaps with I29: test specs written in glossary terms that an agent runs and records as deterministic tests. This issue does not decide anything.

## The formula and its names

vivief wrote one formula for every state transition, and this repo has said it three ways so far:

| Where | Written as |
| --- | --- |
| vivief's foundation | `effectHandler = (state, intent) => (state', [intent'])` |
| I25 | `(Context, Intent) => (Context', [Effects])` |
| This idea | `(State, Effect) => (State', [Effects'])` |
| `GLOSSARY.md`, Command (D36) | `(readModel, intent) -> changeset or DomainError` |

The names do not agree yet, and some already mean something else here:

- `Effect` in the glossary is the TypeScript library. vivief's effect is data: a description of something that happens or is asked for. One of the two needs another name, or the glossary needs to say which one a page means.
- `Intent` is "what the user asked for, before it is checked", the input to a command. In vivief's formula the input can be any effect, not only a user's.
- `State` and `Context` are not glossary terms. The command's state is a read model, and the command does not return a new one: it returns a changeset, and the new read model follows when the changeset is applied and projected. Whether the formula's `State'` is the changeset, the read model after projection, or the log, is part of the naming question.
- `Command` already is the formula in this stack's words, for one kind of change.

vivief also grouped effects by level ([foundation](https://github.com/pietgk/vivief/blob/main/docs/contract/foundation.md#55-effect-hierarchies), section 5.5): low-level effects at a boundary (a database query, an HTTP request), high-level effects composed from them by rules (charge a payment, authenticate a user), and actor-level effects (state machines). "Super high" is not one of vivief's levels; it is new here, and what it means is a question below.

## What a glossary entry has today

D94 gave every entry the same shape:

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
- **The deterministic part is visible.** The effect form says what code can do and states the reasoning part explicitly, like vivief's two worlds and its deterministic-first path (I25).
- **Checkable.** An effect form names inputs and outputs that exist in code (Schema types, services, commands), so `verify` could check that they exist, the way it checks references (D87) and guide shapes.

## Where it overlaps

- **I29.** A high-level test spec says goals in plain words; an agent runs it and records the actions as a deterministic test, which runs fast and without a model until it fails, and a new agent run then updates it. If the test spec uses glossary terms, and each term has an effect form, the spec says less that is ambiguous, the agent has a better model of the app, and the recorded test can be checked against the effects the terms promise.
- **I26.** Names that clash with outside code, docs, lessons and other projects (`Effect`, `Worker`, `Stage`, `workflow`, `cursor`). An effect form makes our sense of a term explicit, which is what a reader needs when the same word means something else nearby.
- **I25.** Its entry concept is design from code, truth from OTel. High-level effects are what vivief lifted from code with rules and drew as C4 views; an effect form per term could be the vocabulary of the design model and of the live picture.
- **I28.** Another project whose names clash with ours, and which describes infrastructure as Effect programs.
- **I21.** The plain sentence is tested with a reader outside software; the effect form could be tested with an engineer and an LLM.

## Questions for the brainstorm

- What are the names in the formula: `State` or `Context`, `Effect` or `Intent`, and which word stays for the TypeScript library? Does the formula become a glossary term itself?
- What do the levels mean here: low, high, actor-level, and is "super high" a user goal or a whole flow, the level a test spec is written at?
- What is the notation: plain text like the sketches, TypeScript types, an Effect Schema, or a small DSL that `verify` can parse? Does it live in `GLOSSARY.md` or next to the code it names?
- Which terms get an effect form: every term, or only those that are something the system does (Command, IntentComposer, Workflow, Activity, Projector), and not those that are a thing or a rule (Datom, Layer, Gate)?
- How is an effect form checked: that its inputs and outputs exist in code, that its deterministic part has tests, that its reasoning part is named where an agent or a human decides?
- How do test specs (I29) use it: written only in glossary terms, checked for unknown terms like D87 checks unknown ids?

## Comments
