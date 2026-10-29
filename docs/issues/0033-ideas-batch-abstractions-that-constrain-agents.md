# I33: Ideas batch: abstractions that constrain agents

Status: ready-for-human

Category: enhancement

Decide when: map 4, where an agent can still write bad code that passes `verify`

Found: 2026-10-04

Series: ideas-batch, seventh batch: `ideas-batch-abstractions-that-constrain-agents`

## What

Three notes from reading and watching point the same way: design more and better abstractions, so that bad code cannot be written and an agent can only make good choices. They raise whether "abstraction" is a better name than "pattern" for what this stack delivers, how far "make bad code unrepresentable" already goes here, and where a very high abstraction, the way a problem is taken from problem to conclusion, belongs. This issue does not decide anything.

## The notes

1. **Abstraction or pattern?** Is "abstraction" a better name than "pattern" for what ViViEfs delivers, seen in the whole context?
2. **Matt Pocock: "Make bad code unrepresentable."**
3. **Matt Pocock, after a conversation with @poteto**, on X, copied from notes on 2026-10-04:

   > My hot take from chatting to @poteto is that we should use MORE abstractions in the AI age. You can use them (combined with harsh lint rules) to reduce the design space available to the agent and constrain them only to good decisions. Combined with the fact that high-leverage abstractions let you do more with less code so, more token efficient. Plus, unwinding the damage from a bad abstraction is much cheaper with agents.
   >
   > This runs counter to a lot of folks thinking that agents just want to read the raw code. They can, but they're not maximally efficient that way. Be braver! Design abstractions.

4. **A statement that needs a place:** problem (with the why, fully defined), clarify (good questions, only the needed ones), design (trade-offs: fix, solve, improve, avoid), failure, conclusion. It is a very high abstraction, and it is not clear yet when, how and why it is used.

## Abstraction or pattern

- **What "pattern" means here.** `GLOSSARY.md`: "A proven way to build one part of an app, written down once so every app here builds that part the same way. It has one contract and may have several implementations." It is delivered when gates prove its claims, its exemplar passes verify and its guide is accepted ([ADR-0026 Verify - Qualify - Teach][ADR-0026]).
- **"Abstraction" is wider.** A pattern is one kind of abstraction. The stack has others that are not patterns: a contract (an Effect service and its types), a Layer, a suite, a command, a branded id, a Schema, the gate itself. Calling all of them abstractions would name what they share: each hides how and constrains what may be done.
- **What each word says to a reader.** "Pattern" says "a known shape you repeat"; "abstraction" says "a boundary you work through". A newcomer outside software ([I21 Test the glossary with a reader outside software][I21]) may know neither in this sense.
- **The cost of renaming.** "Pattern" is in every guide, the delivery rule ([ADR-0026 Verify - Qualify - Teach][ADR-0026]), the glossary and the decision log. A rename touches all of them; a second term next to it (a pattern is the delivered kind of abstraction) touches fewer. This is a naming question like those in [I30 Ideas batch: glossary entries written as effects][I30].

## Make bad code unrepresentable: what is here already

[ADR-0025 AI-robust guardrails][ADR-0025] (AI-robust guardrails, [D26 AI-robust guardrails][D26]): "Guardrails an agent cannot slip past: the Effect language service, determinism and boundary lint, Schema at every boundary." In practice:

- **Types.** Effect's error and requirement types: a missing Layer is a compile error, because a feature's requirements are its `R` type ([D52 Four project kinds][D52]). Branded entity ids ([D38 Entity ids and strict composition][D38]). Strictness flags `verbatimModuleSyntax`, `exactOptionalPropertyTypes`, `moduleDetection: "force"` ([ADR-0031 TypeScript strictness flags from Effect, evaluated][ADR-0031]).
- **Lint.** Raw `Promise`, `async` and `try` are forbidden in domain and workflow code; `Date.now()`, `Math.random()` and id generation only inside activities, so workflow replay stays deterministic; Nx boundary tags so nothing imports an app or a tool ([D52 Four project kinds][D52]).
- **Schema at every boundary**, SQLite rows included.
- **Verify.** Every production file has one file treatment; coverage is a ratchet; flakiness is a defect ([D48' Verify - Qualify - Teach][D48']); a guide must have the template's shape.

So the stack already works by Matt Pocock's rule. The questions are where it stops (what can an agent still write that is wrong and passes), and whether more abstractions, not more rules, would close those gaps.

## More abstractions for agents

The claim, in this stack's terms: an agent given a contract, a Layer and a suite has fewer decisions to make than one given raw SQLite, and every decision it cannot make is one it cannot get wrong. High-leverage abstractions also mean less code to read and write, so fewer tokens. Links:

- **[I29 Ideas batch: agents that record a replayable run][I29].** A recorded, replayable test is an abstraction an agent fills in once and then cannot drift from.
- **[I30 Ideas batch: glossary entries written as effects][I30].** A glossary term with an effect form is an abstraction an agent reads instead of the code behind it.
- **[I25 Ideas batch: understanding and maintaining code bases][I25].** Tools such as ripwire answer "what should I touch" from structure instead of raw files, which is the same bet.
- **vivief.** "Push as much as possible into the deterministic world": an abstraction is how work moves there. Its [knowledge evolution path](https://github.com/pietgk/vivief/blob/main/docs/contract/vivief-concepts-impl-kb.md#knowledge-evolution-path) is how one is earned: tacit knowledge, a knowledge file, a proto-rule, a proposed rule, an active rule, enforcement in infrastructure ([I34 vivief as the source of ViViEfs's concepts][I34]).
- **The risk.** A wrong abstraction constrains every agent the wrong way at once. Matt Pocock's answer is that agents make unwinding it cheap; the gates and suites are what would tell us an abstraction is wrong.

## From problem to conclusion

The statement already has a home in part: the ADR template's sections are **Problem** ("the concrete problem, context, requirements, and decision drivers"), **Design**, **Trade-offs**, **Failure-handling** and **Outcome** (Expected and Observed). The step that is not there is **clarify**, which is what the `grilling` skill does in conversation, and the issue template's Questions sections hold for a while. Other places with a similar shape:

- **A gate**: a claim that could be false, a probe that tests it, a positive control that proves the probe can fail, evidence, and a result in the ledger.
- **An issue**: What, then Questions, then the answer in its comments.
- **Wayfinder**: a destination, decision tickets, fog, out of scope.
- **Bug fixing**: reproduce first, then fix, then prove the fix.

So it may be the abstraction above all of these: one shape every decision, ADR, gate, issue and fix goes through, with "failure" meaning both how the design can fail and how we would know.

## Questions for the brainstorm

- Does "pattern" stay, with "abstraction" as the wider term above it, or does the stack rename? Which other names change with it (pattern guide, pattern map, `<pattern>/<aspect>` suites)?
- Where can an agent still write bad code that passes verify today, and is the answer a new abstraction, a lint rule, a type, or a suite?
- Which high-leverage abstractions are missing: a feature slice generator ([D66 Exercise tracks][D66] names an `exercise` generator), a screen, a command with its tests?
- Does the problem, clarify, design, failure, conclusion statement become a glossary term and one template that ADRs, issues and gates share, or stay a way of working that each keeps in its own shape?
- How is "an abstraction is wrong" noticed and undone, and which evidence shows it?

## Comments

2026-10-09: Triaged with the human ([2026-10-09 Phase 0](../research/2026-10-09-phase-0-review.html), the sequence in [next-session](../plan/next-session.md)): its home is an input to [I56 One shape at every level?][I56]; whether "abstraction" or "pattern" names what ViViEfs delivers is map 3's.

2026-10-24: [I56 One shape at every level?][I56] gives the shape no role in the problem-to-conclusion statement. That statement is [D98 Vision - View - Effects][D98]'s loop at the decision level, a lens ([D132 Four states at every level][D132], [D98' Vision - View - Effects, at every level][D98']): a review page is hot, the human settling a round is the frontier, the decision log is warm, and the ADR and glossary are cold. What constrains an agent at the data level is the split between decide and evolve: a command cannot write, and a projector cannot decide ([D130 One shape at the data level][D130]). Input for map 3: the human's kinds of intent, from a WayFinder map, a grilling with docs, a grilling, a prompt and one decision down to a button press, ordered by how abstract the intent is ([D132][D132]), are the strongest case so far for "abstraction" as the wider word; a pattern keeps its delivered meaning, and an app is not one. Whether "abstraction" or "pattern" names what ViViEfs delivers is map 3's. "Where can an agent still write bad code that passes" goes with map 4.

2026-10-27: map 3 started. "Abstraction" or "pattern" is decided in [I90 Pattern, concept, contract, abstraction][I90] Pattern, concept, contract, abstraction, which comments here on what is left.

2026-10-28: from [I90 Pattern, concept, contract, abstraction][I90]. Note 1 is answered: pattern stays what ViViEfs delivers, concept is the wider word, and "abstraction" stays plain English, the code's abstractions keeping Effect's names ([D181 Concept is the wider word][D181], [D182 Abstraction stays plain English][D182]). Note 4 was answered by [I56 One shape at every level?][I56]. What is left is notes 2 and 3: where can an agent still write bad code that passes `verify`, and does a type, a lint rule, a suite or a new abstraction (a generator for a feature or a command with its tests) close it. That goes with map 4.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0025]: ../adr/0025-ai-robust-guardrails.md
[ADR-0026]: ../adr/0026-verify-qualify-teach.md
[ADR-0031]: ../adr/0031-typescript-strictness-flags.md
[D130]: ../plan/bootstrap/02-decision-log.md#d130
[D132]: ../plan/bootstrap/02-decision-log.md#d132
[D181]: ../plan/bootstrap/02-decision-log.md#d181
[D182]: ../plan/bootstrap/02-decision-log.md#d182
[D26]: ../plan/bootstrap/02-decision-log.md#d26
[D38]: ../plan/bootstrap/02-decision-log.md#d38
[D48']: ../plan/bootstrap/02-decision-log.md#d48p
[D52]: ../plan/bootstrap/02-decision-log.md#d52
[D66]: ../plan/bootstrap/02-decision-log.md#d66
[D98]: ../plan/bootstrap/02-decision-log.md#d98
[D98']: ../plan/bootstrap/02-decision-log.md#d98p
[I21]: 0021-test-the-glossary-with-a-reader.md
[I25]: 0025-ideas-batch-understanding-and-maintaining-code-bases.md
[I29]: 0029-ideas-batch-agents-that-record-a-replayable-run.md
[I30]: 0030-ideas-batch-glossary-entries-written-as-effects.md
[I34]: 0034-vivief-as-the-source-of-viviefs-concepts.md
[I56]: 0056-one-shape-at-every-level.md
[I90]: 0090-pattern-concept-contract-abstraction.md
