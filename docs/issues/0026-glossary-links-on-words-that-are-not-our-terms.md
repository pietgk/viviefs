# I26: Glossary links on words that are not our terms

Status: needs-triage

Category: bug

Found: 2026-10-03

## What

The docs site links a word to its glossary entry even where the page uses that word in another project's sense, so a reader who hovers it gets a wrong meaning, and there is no way to mark a passage as "not our terms". The linker (D94, `termFinder` in `apps/docs/src/lib/references.ts`, run by `apps/docs/src/lib/reference-links.ts`) links the first use of each glossary term on a page, in any case and in the plural, except in headings, code, links and a few glossary places. The `EVERYDAY_TERMS` list (`Command`, `Effect`, `Service`, ...) only links those words when they are capitalised mid-sentence. That keeps "a side effect" from linking to Effect, but it cannot tell our Workflow from another tool's workflow.

## Observed

Writing I25, a page about other projects (repowise, LikeC4, archify, Bausteinsicht, draw.io, Grafana, vivief), linked these words in the wrong sense before they were reworded:

| Text on the page | Meant | Linked to |
| --- | --- | --- |
| `architecture, workflow, sequence` (archify's diagram kinds) | a kind of diagram | Workflow (durable work on the engine) |
| `Cursor's index` | the `Cursor` editor | Cursor (a sync position) |
| `Nextcloud with shared cursors` | mouse pointers of other people | Cursor |
| `The diagram editor Bausteinsicht builds on` | uses | Builds on (a pattern relation) |
| `Desktop app, web app` | a program | App |
| `joined (names, ids, attributes)` | keys on OTel spans | Attribute (of a datom) |
| `plays a pattern or a gate step by step` | one step at a time | Gate step |
| `Vision View Effect` (vivief's name) | vivief's effect | Effect (the library) |
| `HTTP, actors, state machines` (a vivief quote) | the `actor` model | actor (the envelope field) |
| `ADR 0027` of vivief, as link text | vivief's ADR | ADR-0027 of this repo (D87 turned the link into a link to our ADR) |

Each was fixed by rewording, by moving the word into a link (links are skipped), or by dropping it. Words like "pattern", "intent" and "contract" in the vivief section still link to our entries, close but not the same sense.

## Why it matters

- A wrong hover is worse than no hover: the reader trusts it, because D94 makes the glossary the place where a term means one thing.
- Authors bend prose around the linker. The workarounds above change what a sentence says, or make a link only to switch off linking.
- It will happen more. The ideas-batch issues (I24, I25) and research records describe other projects on purpose, and quotes from them use their words.
- The last row is the same problem for D87 references: an id from another repo (vivief's `ADR 0027`) is read as an id of this one.

## A way to prevent it: names that carry their context

A term that names its context and domain from the start clashes less with words that enter later from outside. vivief's [foundation glossary](https://github.com/pietgk/vivief/blob/main/docs/contract/foundation.md#12-glossary) does this: `Code Effect`, `Flow Effect`, `Group Effect`, `UI Effect`, `Executable Spec` (a lint rule that enforces architectural intent), and its [concepts quick reference](https://github.com/pietgk/vivief/blob/main/docs/contract/concepts-quick-ref.md) has `Code Diagnostics`, `Effect Telemetry`, `A11y Edge` and `DevAC Health`. A bare `Effect` or `Spec` would have taken the whole word. The same glossary also shows the opposite: it defines a bare `Sibling` as "another repo in the same workspace", which takes the word for one meaning.

This repo has the problem waiting already: the plans call vivief, complyj and web-interview "sibling repos", and the K-Plex research (2026-10-02) uses siblings for concepts that share a parent in a navigation tree. A glossary term `Sibling` would lock the word for one of the two; `Sibling Repo` and `Sibling Concept` keep both, and leave "sibling" free in its plain sense (a brother is a sibling) when a product app needs it. The same holds for words that already clash here: workflow, cursor, attribute, app, engine.

## Questions

- How does an author mark a passage, a quote, a table or a whole page as "not our terms": a block quote, a directive such as `:::foreign`, a comment marker, front matter, or a per-folder rule like `KEPT_AS_WRITTEN` for paths?
- Should a mark stop glossary links only, or D87 references too (ids of another repo)?
- Should every new glossary term name its context (`Sibling Repo`, `Code Effect`), and should existing bare terms (Workflow, Cursor, Attribute, Engine) be renamed that way, or only marked where they clash?
- Should a source table or a quote of another project be detected without a mark, for example every block quote?
- Should `verify` report terms linked in a marked passage, or a term whose sense is ambiguous, so a human decides?
- Is a short list of words with more than one sense in our own docs (workflow, cursor, attribute, app) worth adding to the `EVERYDAY_TERMS` rule, or is a mark enough?

## Comments

2026-10-04: The same happens to ids. Pinot's latency figure `10ms P95` (the
95th percentile) in I31 failed the build: `P95` reads as a gate id that does
not exist (D87). It was rewritten as "the 95th percentile". Percentiles
(`P50`, `P95`, `P99`) will come back in any page about telemetry.
A quote cannot be reworded at all: in I33, Matt Pocock's "constrain them only
to good decisions" links "decisions" to our Decision entry, and the quote has
to stay as he wrote it.
