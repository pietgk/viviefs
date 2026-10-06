# Three ways to explore the glossary as a K-Plex

Research record, 2026-10-06. **Iteration 1; preferred design pending human
review.** Open the [initial interactive comparison](2026-10-06-glossary-k-plex.html).
This is discussion material under D68, not an accepted design, a production
glossary interface, qualification evidence or a demonstrated learning benefit.
No comprehension study or actual K-Plex plugin runtime test has been performed
for this record.

The question is how to present the repository's vocabulary so engineers and
people outside software can understand both a term and its relationships, then
use that understanding to discuss and develop this repository. The approved
experiment compares three K-Plex-inspired presentations using the same real
terms and sourced relationships. It explores browser presentation semantics;
it does not adopt Obsidian or change the canonical glossary.

## Canonical content and the comparison set

Repository inspection used revision
`b05fbc6e047e73bb655c19e87692f7a361f2709f`.
[GLOSSARY.md](../../GLOSSARY.md) remains authoritative for vocabulary. It says
accepted ADRs win if a definition disagrees with them. Every entry has a name
and begins with one plain sentence, followed by the precise description. Many
entries also list names to avoid. These are the four pieces a presentation
must preserve: canonical name, first sentence, full definition and avoided
names. The source does not require the first sentence and remaining description
to occupy separate paragraphs.

Existing term links in the docs are largely derived when pages render, rather
than authored links between entries in the raw glossary. The docs extract names
and first sentences, then find term occurrences with longest-term and
whole-word matching. Everyday words receive additional capitalization rules.
Inside a glossary entry, its own term and Avoid list are excluded from linking.
Those rules already distinguish a domain term from an ordinary word; a research
prototype must not replace them with indiscriminate substring matching.
[Term extraction and matching](../../apps/docs/src/lib/references.ts),
[reference linking](../../apps/docs/src/lib/reference-links.ts).

The approved comparison includes three clusters, with the same membership in
each variant:

| Cluster | Terms | Question it helps explore |
| --- | --- | --- |
| Architecture | Pattern, Contract, Implementation, Service, Layer, Guide, Exemplar | What is promised, what keeps that promise, and how is it explained? |
| Data | Changeset, Datom, Commit datom, Manifest, Basis, Envelope, Projector, Read model, Log store | How do several facts become visible together, and how does a screen read them? |
| Identity | Person, Provider account, Identity provider, Access token, Token verifier, Caller, Membership, Organization | Who signs in, who is asking, and which organization's data may they act on? |

Clusters are selected teaching contexts, not a new domain hierarchy. Organization
appears in the glossary's Data section but belongs in the identity comparison
because Membership names its relationship to an organization. The experiment
does not relocate its canonical definition or imply that every concept in a
cluster is contained in another.

## Three presentations to compare

| Variant | What the reader encounters | Hypothesis to test |
| --- | --- | --- |
| **A: One term and its neighbours** | A central term card with its plain sentence; incoming and outgoing connections have readable directed labels. Selecting a neighbour moves the focus. The full definition and avoided names are available on demand. | A small, stable neighbourhood makes independent exploration easy without hiding the term's meaning. |
| **B: Relationships as readable sentences** | Subject, predicate and object appear as readable rows beside the map. Selecting a relationship highlights its endpoints and shows the source passage; a focus inspector supplies the definition. | A sentence communicates direction and meaning more clearly than position or an arrow alone. |
| **C: A guided explanation** | A short narrative reveals related nodes one at a time alongside a mini-map. A reader can explore freely and resume the explanation. | A deliberate introduction gives newcomers enough context before they navigate independently. |

Switching variants retains the chosen cluster and term so the comparison is
about presentation, rather than three different examples. All variants expose
the same canonical definition content and relationship meanings. Progressive
revelation changes when information appears, not what the glossary says.
Walkthrough order in C is a teaching choice, separate from a domain sequence
and from browser history.

The live Lavish review collects a preferred variant or a mix, the reason for
that choice and specific confusing elements. The dated HTML linked above is
the preserved initial comparison, while Lavish is the working review surface.
Later review outcomes should be recorded as dated follow-up research rather
than silently changing this initial record.

### Meaning belongs to the relationship, not its position

The comparison has two distinct sources of connections:

- **Term mentions** record that one definition uses another term. They provide
  routes for further reading. Mention direction does not establish containment,
  dependency, causation or sequence.
- **Sourced relationship labels** are curated from a specific glossary passage.
  They retain subject, predicate, object and the passage explaining the label.
  They are a proposed presentation interpretation of that passage, not a new
  canonical relationship schema.

For example, the glossary says a Pattern has a Contract, an Implementation keeps
that Contract, and a Layer supplies a Service. In Data, a Changeset becomes
visible when its Commit datom arrives; that fact carries the Manifest and Basis,
and its Envelope travels alongside it. In Identity, a Provider account names its
Person, an Identity provider issues Access tokens, and Membership grants a
Person the right to act in an Organization. These statements supply candidate
labels; the source passage must remain inspectable so a reader can check that
the shorter label has preserved the meaning. [Canonical definitions](../../GLOSSARY.md).

Avoided names remain attached to their canonical term as **naming guidance**.
They are not accepted aliases, extra concept nodes or challenger relationships.
Searching one can help a reader find the intended vocabulary, but must explain
that correction. An avoided word can be ambiguous: **user** is avoided for both
Person and Provider account. A search for it must offer both candidates with
their plain sentences, rather than silently selecting one. Likewise, the
Envelope's **actor** is a field, and the glossary explicitly says it is not an
Actor entity or type. [Naming distinctions](../../GLOSSARY.md).

## What the primary K-Plex sources establish

The earlier [concept-navigation research](2026-10-02-k-plex-concept-navigation.md)
distinguished published K-Plex 0.0.5 from newer main-branch behavior. On this
check, main resolves to
`2c9d15a38e596a9012321122e766c7748e7c53a1`, dated 2026-10-05. The latest published
release remains **0.0.5**, dated 2026-09-24, while main's manifest also reports
0.0.5. Thus the version number alone cannot identify the inspected code. The
findings below are documentation and source inspection of that pinned main
commit, not runtime observations or proof of release behavior.
[Release 0.0.5](https://github.com/zsviczian/kplex/releases/tag/0.0.5),
[main commit](https://github.com/zsviczian/kplex/commit/2c9d15a38e596a9012321122e766c7748e7c53a1),
[manifest](https://github.com/zsviczian/kplex/blob/2c9d15a38e596a9012321122e766c7748e7c53a1/manifest.json).

K-Plex documents one focused note at the centre, parents above, children below,
friends or previous notes left, challengers or next notes right, and siblings
in a separate peripheral area. Selecting a note recentres it. Search, navigation
history, labelled connectors and a companion document pane support moving
between a map and its meaning. These are useful precedents for the comparison.
[Pinned README](https://github.com/zsviczian/kplex/blob/2c9d15a38e596a9012321122e766c7748e7c53a1/README.md).

The source assigns fixed inverse roles: parent reverses to child, previous to
next, while friend and challenger remain symmetric. Sibling is not a declared
relationship role; sibling neighbourhood work follows parent incidence. Custom
ontology fields map to these existing roles rather than creating arbitrary new
role inverses. Our incoming/outgoing regions and readable domain predicates are
therefore **proposed adaptations**. Their behavior must not be presented as
automatic K-Plex plugin compatibility.
[Evidence roles](https://github.com/zsviczian/kplex/blob/2c9d15a38e596a9012321122e766c7748e7c53a1/src/core/graph/evidence.ts#L54),
[role model](https://github.com/zsviczian/kplex/blob/2c9d15a38e596a9012321122e766c7748e7c53a1/src/core/graph/relations.ts#L14),
[sibling neighbourhood](https://github.com/zsviczian/kplex/blob/2c9d15a38e596a9012321122e766c7748e7c53a1/src/index/CachedRequestedNeighborhood.ts).

Ordinary links can become inferred children, parents or friends according to
settings. Competing defined roles can resolve laterally. This is why rendered
glossary links must not automatically become typed domain relationships.
Retaining the source explanation is especially useful when two terms have more
than one relationship.
[Compiler inference](https://github.com/zsviczian/kplex/blob/2c9d15a38e596a9012321122e766c7748e7c53a1/src/core/graph/compiler.ts#L705),
[relationship resolution](https://github.com/zsviczian/kplex/blob/2c9d15a38e596a9012321122e766c7748e7c53a1/src/core/graph/resolver.ts#L69).

Graph Lenses show, hide or style the current neighbourhood using notes,
relationships or their source evidence. They do not query arbitrary depth
across the entire vault. Keeping layout preserves positions; reflowing compacts
the remaining nodes. Shown/total counts make hidden connections visible as
context. These features suggest optional reader perspectives, but do not
establish built-in engineer or non-engineer glossary modes.
[Graph Lenses](https://github.com/zsviczian/kplex/blob/2c9d15a38e596a9012321122e766c7748e7c53a1/docs/GRAPH_LENSES.md).

## Review questions and evaluation tasks

Use the same tasks in all three variants. Ask the reader to explain the answer
in their own words and point to the passage supporting it:

1. **Architecture:** What is the difference between Contract and Implementation?
   Where do Service and Layer fit? Avoid mistaking a promise for the recipe that
   supplies a capability.
2. **Data:** When does a Changeset become visible? What do Commit datom, Manifest
   and Basis contribute? Avoid implying that each arrival becomes visible
   immediately or that Manifest and Basis are interchangeable.
3. **Identity:** How do Person, Provider account and Membership differ? What
   happens when the same person has two logins or belongs to two organizations?
   Avoid equating authentication with permission to act.
4. Find a term through an avoided name, including ambiguous **user**, and explain
   which canonical name fits the question.
5. Follow a relationship, move the focus and return. Switch presentations while
   retaining the same term. Explain the direction of a connection and why it
   exists without relying only on its screen position.

For each task, record what confused the reader, whether they needed the paragraph
description, whether the source passage helped, and whether the map introduced
an incorrect interpretation. Ask which variant or combination they prefer and
why. Preference feedback from this review is not evidence that a design improves
comprehension for both audiences. The existing [glossary reader-test issue](../issues/0021-test-the-glossary-with-a-reader.md)
remains relevant and is not completed by this design comparison.

Engineering checks for the research surface include complete definitions and
Avoid lists, valid source links, correct directed labels, keyboard operation,
readable desktop and narrow-screen layouts, and a usable path to details without
hover. Verify that recentering does not imply a different fact, that the guided
path can be resumed, and that terms outside a selected cluster are not silently
misrepresented as nonexistent. Browser usability checks and repository verify
results are separate from the human review and should be reported with the
reviewed artifact revision.

### Initial browser checks, 2026-10-06

The initial comparison contains 24 terms and 30 curated, directed relationships.
The build checked every cited passage against its named glossary definition.
One-sentence summaries are taken from each complete definition with wrapped
lines joined, preserving the sentence beyond a Markdown line break. The
presentation uses the existing term matcher for cross-references; it does not
change the production glossary parser or renderer.

Browser checks covered recentering and previous-focus navigation; retaining
cluster and focus across all three variants; inspecting relationship sources;
all four identity walkthrough steps, free exploration and resuming; and the
ambiguous **user** search offering Person and Provider account with their plain
sentences and naming guidance. A stubbed feedback API confirmed that selecting
a direction queues nothing, while submitting queues one replaceable answer.
No reviewer feedback was fabricated or submitted by those checks.

All nine cluster/variant combinations were checked at a 390-pixel viewport with
no horizontal overflow. Desktop layouts were visually inspected at 1440 pixels.
These are usability and operation checks, not comprehension findings. The
standalone HTML embeds its styles, data and scripts; it does not require Lavish
or an external script or font. Source links still require network access.

## Preliminary recommendations and next use

These are hypotheses awaiting review:

- Keep the plain sentence visible at the focus in every presentation. Let readers
  open the precise definition without choosing a permanent audience mode.
- Use readable predicates and inspectable source passages throughout. Position
  can make navigation predictable but should not carry domain meaning alone.
- Explore combining C's introduction with A's free navigation and B's relationship
  inspection if the review shows that each solves a different reader problem.
- Retain one canonical glossary and derive presentation data. Curated label
  interpretations need review when their source definitions change; a term mention
  alone cannot supply them.

The eventual research result should preserve the compared artifacts, the human's
feedback, the preferred approach and its reasons, unresolved questions and the
conditions under which a future glossary presentation is accurate and useful.
A subsequent production proposal can use that result without treating the
prototype as a delivered pattern or changing repository terminology.

Related context: [K-Plex, simply explained](2026-10-06-k-plex-explained.md),
[preserved explainer](2026-10-06-k-plex-explained.html),
[earlier concept-navigation research](2026-10-02-k-plex-concept-navigation.md),
and the [research index](README.md).
