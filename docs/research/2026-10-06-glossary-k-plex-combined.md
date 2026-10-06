# Combining the glossary explainers

Research record, 2026-10-06. **Iteration 2; composition and naming pending human
review.** Open the [new interactive comparison](2026-10-06-glossary-k-plex-combined.html)
or return to the [preserved first comparison](2026-10-06-glossary-k-plex.html).
This is discussion material under D68, not an accepted interface, production
implementation, qualification evidence or a demonstrated learning benefit.

## What the first review established

The user reviewed the three original approaches and explicitly found all of
them useful: **A, a focused map; B, relationships as sentences; and C, a guided
explanation**. Their preference is to retain all three because the best way to
understand a relationship depends on the person and their current investigation.
This feedback changes the design question from choosing one presentation to
making the presentations work together. It does not establish that one improves
comprehension more than another. The source of this preference is the user's
feedback in the Codex conversation on 2026-10-06; the original approaches and
their hypotheses are preserved in the [first research record](2026-10-06-glossary-k-plex.md).

The same feedback proposes keeping the following close together at the top:

- The cluster's question and cluster selection.
- Finding a term and browsing or filtering terms in that cluster.
- Focus history and the path back to earlier terms.

The user also proposes an **Explainer** section with a presentation selector
that can support A, B, C and future approaches. The distinction between an
explainer and its details seems useful to them. **Explorer** is another candidate
name, and starting with C's guided exploration while including A and B is worth
trying, although the user identifies that composition as potentially tricky.
These are recorded preferences and suggestions, not new canonical domain terms.

## What stays constant

The second comparison uses the same embedded content snapshot as the first:
24 canonical terms, 30 curated directed relationships, and the architecture,
data and identity clusters. Every shell offers all three original explanation
methods. Changing the shell should retain the selected cluster and term, so the
comparison concerns composition rather than different examples.

[GLOSSARY.md](../../GLOSSARY.md) remains the vocabulary source. The embedded
snapshot uses glossary revision `82164c37bf1c20bd9b44ea0e4a02d6a95a5d341b`.
Names, plain first sentences, complete definitions and avoided names remain
available. Relationship labels remain proposed summaries of cited glossary
passages; readers can inspect their sources. Avoided names remain naming
guidance, including the ambiguous **user** search, rather than accepted aliases
or additional graph nodes. The [first record](2026-10-06-glossary-k-plex.md)
contains the extraction rules, cluster membership and primary K-Plex sources.

This iteration reuses those source findings. It makes no new claim about the
current K-Plex release or plugin behavior. The three shells are browser research
prototypes inspired by focused navigation, not a K-Plex plugin integration.

## Three new compositions

| Idea | Top section | How the explainers work together | Question to test |
| --- | --- | --- | --- |
| **1: Term-first desk** | **Explore the glossary** brings the question, cluster, search, term browsing and history together. | One **Explainer** region switches between Map, Relationships and Guided. A shared detail inspector provides the focused term's definition and relationship sources. | Does one stable place for the current term make switching explanations predictable? |
| **2: Question-led explorer** | **Find a starting point** offers the same navigation controls around the cluster's question. | A persistent guided step rail supplies a route through the topic. Map, Relationships and Guided remain coequal explainer choices. Free exploration and resuming the guide are explicit. | Can a suggested route help newcomers while remaining easy to leave and resume? |
| **3: Investigation workspace** | **Find your bearings** combines the question, cluster, term controls and focus history. | Readers choose which Map, Relationships and Guided panes to display together, with a shared detail inspector. At least one explainer remains selected. | Does seeing complementary explanations together help investigation enough to justify the extra visual density? |

These names deliberately test different ways to describe the top section.
**Explorer** can describe the whole activity while **Explainer** describes the
selected presentation within it. That distinction is a design candidate, not
a settled naming decision. The guided step order is a teaching route, not a
domain sequence, a dependency ordering or the reader's focus history.

The first idea emphasizes a single presentation at a time. The second adds a
continuing route through the question. The third permits comparison within the
working screen. Keeping them structurally different makes their tradeoffs
reviewable without forcing a preferred method on every reader.

## Review tasks

Repeat a small investigation in every shell, switching explanation methods
without changing the question:

1. In architecture, distinguish Contract from Implementation, then explain where
   Layer and Service fit. Inspect the passage supporting one relationship.
2. In data, find when a Changeset becomes visible and explain the roles of Commit
   datom, Manifest and Basis. Compare the map with the relationship sentences.
3. In identity, distinguish Person, Provider account and Membership. Search for
   **user**, choose the appropriate canonical term and explain why the other
   candidate represents a different concept.
4. Follow several terms, return through focus history, switch shells and check
   whether the current investigation remains understandable.
5. Leave a guided route to investigate another term, then resume it. Explain
   whether the route and the focus history feel distinct.
6. In the workspace, show two explanations together, then simplify to one. Check
   whether their shared details still clearly refer to the current focus.

Record which composition fits the task, what was confusing, whether the top
controls are easy to locate, and whether **Explainer**, **Explorer** or another
label better describes each section. Preference may vary by task; the goal is
not to manufacture a single winner if several arrangements remain useful.

## Validation and remaining decisions

The review surface was exercised in Chrome at 1440px and 390px:

- All three clusters and each single-method view, plus all three simultaneous
  panes, fit within the viewport without horizontal page overflow.
- All 36 guided-step combinations (three shells, three clusters, four steps)
  displayed their expected focus and sourced relationship sentences.
- All 24 terms were checked in each shell (72 term/shell combinations).
  Switching shells and methods kept the selected term. Following terms,
  returning through history, leaving the guide and resuming it worked.
- Searching **user** offered Person and Provider account with their canonical
  summaries. Selecting one moved to its cluster and kept avoided-name guidance.
- Relationship sources displayed their supporting quotes. Full definitions,
  inline term links, mobile detail navigation and the one-pane minimum worked.
- Keyboard focus survived replacing mode and pane controls. URL state includes
  shell, cluster, term, method, guided step and visible panes. Reopening
  the standalone export restored that context. Its feedback fallback also worked.
- Feedback was tested with a local queue stub: changing a select sent nothing;
  explicit submission queued once with composition, naming and context metadata.
  No QA feedback was sent to the live reviewer session.
- Final browser console checks reported no script errors. Desktop and mobile
  screenshots were inspected. This verifies operation, not reader comprehension.

The standalone HTML is an exact export with no external rendering dependencies.
Its embedded DATA is identical to iteration 1. The first HTML and Markdown
records remain byte-identical to their committed versions. `mise exec -- pnpm verify`
passed the docs-only pipeline: docs, diagrams and guides. No production code or
qualification state changed.

The open decisions are the preferred composition, top-section wording, the
Explainer/Explorer naming distinction, and how much guidance or simultaneous
content should appear initially. Human review of this new comparison is pending.
The established direction is to retain all three explanation methods and keep
their term and relationship meanings consistent.

The portable HTML SHA-256 is
`62dbccec9ad6a455285d51e453ad53dc7c74b89b7a5a994092a118278b2e1cb3`.
The working review is a separate Lavish session at
`http://127.0.0.1:4387/session/9921d0e12d800ba8`; the preserved first session is
`http://127.0.0.1:4387/session/d7e9cdb5e4b17c44`. Local session addresses are
convenience links; the committed standalone HTML is the durable artifact.

For future sessions, start with this record and its standalone HTML, then consult
the first record for source findings and earlier evaluation tasks. Preserve later
feedback in a follow-up record rather than silently rewriting the first
comparison. A production proposal should identify the chosen behavior and
unresolved questions separately from any eventual qualification or reader-study
evidence.

Related context: [first comparison and sources](2026-10-06-glossary-k-plex.md),
[K-Plex, simply explained](2026-10-06-k-plex-explained.md),
and the [research index](README.md).
