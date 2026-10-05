# I33: Ideas batch: abstractions that constrain agents

Status: needs-triage

Category: enhancement

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

- **What "pattern" means here.** `GLOSSARY.md`: "A proven way to build one part of an app, written down once so every app here builds that part the same way. It has one contract and may have several implementations." It is delivered when gates prove its claims, its exemplar passes verify and its guide is accepted (ADR-0026).
- **"Abstraction" is wider.** A pattern is one kind of abstraction. The stack has others that are not patterns: a contract (an Effect service and its types), a Layer, a suite, a command, a branded id, a Schema, the gate itself. Calling all of them abstractions would name what they share: each hides how and constrains what may be done.
- **What each word says to a reader.** "Pattern" says "a known shape you repeat"; "abstraction" says "a boundary you work through". A newcomer outside software (I21) may know neither in this sense.
- **The cost of renaming.** "Pattern" is in every guide, the delivery rule (ADR-0026), the glossary and the decision log. A rename touches all of them; a second term next to it (a pattern is the delivered kind of abstraction) touches fewer. This is a naming question like those in I30.

## Make bad code unrepresentable: what is here already

ADR-0025 (AI-robust guardrails, D26): "Guardrails an agent cannot slip past: the Effect language service, determinism and boundary lint, Schema at every boundary." In practice:

- **Types.** Effect's error and requirement types: a missing Layer is a compile error, because a feature's requirements are its `R` type (D52). Branded entity ids (D38). Strictness flags `verbatimModuleSyntax`, `exactOptionalPropertyTypes`, `moduleDetection: "force"` (ADR-0031).
- **Lint.** Raw `Promise`, `async` and `try` are forbidden in domain and workflow code; `Date.now()`, `Math.random()` and id generation only inside activities, so workflow replay stays deterministic; Nx boundary tags so nothing imports an app or a tool (D52).
- **Schema at every boundary**, SQLite rows included.
- **Verify.** Every production file has one file treatment; coverage is a ratchet; flakiness is a defect (D48'); a guide must have the template's shape.

So the stack already works by Matt Pocock's rule. The questions are where it stops (what can an agent still write that is wrong and passes), and whether more abstractions, not more rules, would close those gaps.

## More abstractions for agents

The claim, in this stack's terms: an agent given a contract, a Layer and a suite has fewer decisions to make than one given raw SQLite, and every decision it cannot make is one it cannot get wrong. High-leverage abstractions also mean less code to read and write, so fewer tokens. Links:

- **I29.** A recorded, replayable test is an abstraction an agent fills in once and then cannot drift from.
- **I30.** A glossary term with an effect form is an abstraction an agent reads instead of the code behind it.
- **I25.** Tools such as ripwire answer "what should I touch" from structure instead of raw files, which is the same bet.
- **vivief.** "Push as much as possible into the deterministic world": an abstraction is how work moves there. Its [knowledge evolution path](https://github.com/pietgk/vivief/blob/main/docs/contract/vivief-concepts-impl-kb.md#knowledge-evolution-path) is how one is earned: tacit knowledge, a knowledge file, a proto-rule, a proposed rule, an active rule, enforcement in infrastructure (I34).
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
- Which high-leverage abstractions are missing: a feature slice generator (D66 names an `exercise` generator), a screen, a command with its tests?
- Does the problem, clarify, design, failure, conclusion statement become a glossary term and one template that ADRs, issues and gates share, or stay a way of working that each keeps in its own shape?
- How is "an abstraction is wrong" noticed and undone, and which evidence shows it?

## Comments
