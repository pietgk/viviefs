# K-Plex and concept navigation for ViViEfs

[Open the visual research document and interactive concept navigator](2026-10-02-k-plex-concept-navigation.html).

Research record, 2026-10-02. Discussion material, not an ADR, an accepted design or qualification evidence. External sources were checked on this date. Repository inspection used HEAD `82164c37bf1c20bd9b44ea0e4a02d6a95a5d341b`. K-Plex source inspection used main commit `8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815`; main can contain changes beyond a published release. Neither K-Plex nor TheBrain was installed or runtime-tested for this research.

## The useful idea

**Present one concept and its immediate context, then let the reader move the focus.** For this repository, the valuable question is whether a newcomer can move from a term to its meaning, use, implementation and evidence without losing their place. Predictable spatial regions might help. That is a design hypothesis to evaluate with readers, not a demonstrated learning benefit.

K-Plex means **Knowledge Plex**. Its README describes an Obsidian navigator inspired by TheBrain, with a focused note and spatial relationship regions. It supports migration from ExcaliBrain settings without requiring Excalidraw or Dataview. [K-Plex README](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/README.md)

The graph-theory term **k-plex** is different: it describes a dense subgraph obtained by relaxing the clique condition. It is not a rule for placing parents or siblings on screen. The similar name does not make the Obsidian plugin a k-plex clustering algorithm. [Wang et al., Listing Maximal k-Plexes in Large Real-World Graphs](https://arxiv.org/abs/2202.08737)

## Parents, children and the two sides

The two products do not assign the same meaning to every direction:

| Position | K-Plex | TheBrain's documented normal Plex |
| --- | --- | --- |
| Centre | Focused note | Active Thought |
| Above | Parents | Parents |
| Below | Children | Children |
| Left | Friends / Previous | Jumps |
| Right | Challengers / Next | Siblings |
| Separate peripheral area | Siblings | Not the normal arrangement described in the cited guide |

Sources: [K-Plex README](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/README.md), [TheBrain's relationship guide](https://help.thebrain.com/iphone/). TheBrain source is an older official help page describing the normal Plex; it is not a measurement of every layout in version 15.

In TheBrain, a sibling shares a parent with the active Thought. A jump is an associative connection outside the parent/child grouping. TheBrain's current product page also explicitly supports multiple parents. Thus this is a graph with overlapping contexts rather than a single folder tree. [Relationship guide](https://help.thebrain.com/iphone/), [TheBrain 15](https://www.thebrain.com/products/thebrain/thebrain15)

K-Plex's source distinguishes symmetric lateral roles from sequence: a left/friend reverses to left/friend and right/challenger to right/challenger; previous reverses to next, and parent reverses to child. A role that occupies a side is not necessarily a sibling relationship or an ordering rule. [Relationship evidence model](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/src/core/graph/evidence.ts#L60)

**Interpretation:** use separate vocabulary for the relationship and its screen position. A labelled connection such as “builds on” carries meaning. “Above” only tells the renderer where to place it in one view.

## What K-Plex actually gives us

| Finding | Consequence for an experiment |
| --- | --- |
| Manifest reports version 0.0.5, minimum Obsidian 1.13.0, and mobile support | Record the exact app/plugin versions when evaluating it. [Manifest](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/manifest.json) |
| Releases list 0.0.1 on September 20 and 0.0.5 on September 24 | This is a very recent published plugin. Release count is not a reliability assessment. [Releases](https://github.com/zsviczian/kplex/releases) |
| The author explicitly describes ongoing real-world testing | Treat use on a bounded experimental vault as evaluation. [README](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/README.md) |
| Source Markdown remains authoritative; relationships can use frontmatter and inline fields | A disposable generated vault is plausible without making the graph the owner of repository prose. [README](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/README.md) |
| Licence file is GNU AGPL version 3 | Evaluating the separate plugin and incorporating its code are different decisions. Do not assume its implementation is Apache-2.0 code. [Licence](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/LICENSE) |

Graph Lenses filter or style the visible neighbourhood by note, relationship or the source behind a relationship. They do not perform arbitrary deep graph queries across the vault. Filtering can preserve positions or reflow the visible nodes, and shown/total counts expose hidden neighbours. For repository use, those capabilities suggest selectable perspectives such as terminology, implementation or qualification. The perspectives are our proposal, not built-in ViViEfs support. [Graph Lenses documentation](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/docs/GRAPH_LENSES.md)

Source inspection reveals a substantial semantic caveat. Ordinary links can be inferred as child relationships, inverted to parents, or treated as lateral friends, depending on settings. The resolver can collapse competing roles into lateral presentation. A page mentioning a term therefore does not automatically establish a domain parent/child fact. [Compiler inference](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/src/core/graph/compiler.ts#L705), [Relationship resolver](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/src/core/graph/resolver.ts#L69)

Granularity also matters. Internal ontology targets resolve to a file identity while retaining an optional subpath; section nodes are represented as transient runtime identities. This supports navigating within notes, but does not establish persistent concept identities for every paragraph in an arbitrary repository. [Ontology collector](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/src/adapters/obsidian/ontologySourceCollector.ts#L109), [Graph page types](https://github.com/zsviczian/kplex/blob/8b2b49c440c16f1fd7f95b4c7e6c2d101bd94815/src/types.ts#L59)

## TheBrain as a reference and possible host

TheBrain 15 is currently offered as a free full application, with optional online plans. It remains proprietary software under its licence agreement. It is therefore inaccurate to describe today's local app as necessarily requiring a paid licence, or to equate free use with open-source implementation. [Product page](https://www.thebrain.com/products/thebrain/thebrain15), [Licence agreement, effective June 23, 2026](https://thebrain.com/eula)

There are genuine integration routes. Official tutorials document outline and JSON export. Version 15.0.534 or later has a local HTTP API, with documentation accessible inside the desktop application. The current Markdown reference says version 15.0.610 and later can save standard GitHub Flavored Markdown with documented extensions in `Notes.md`; existing brains can opt into the format. These are interoperability features, not proof of lossless round-tripping of repository relationships. [Import/export tutorials](https://www.thebrain.com/support/tutorials), [Local API announcement](https://thebrain.com/blog/thebrain-api-local), [Markdown reference](https://www.thebrain.com/docs/markdown-info)

**Inference:** TheBrain is useful for studying the navigation experience and could host an exported concept map. Its separate graph and import/update lifecycle would need ownership and drift rules if used alongside this repository. K-Plex offers a more direct Markdown-oriented trial, while a docs-site view offers the most direct access for readers already using ViViEfs docs. No integration has been proven here.

## Applying the idea without changing the domain model

The repository already has an unusually strong foundation: canonical definitions in [GLOSSARY.md](../../GLOSSARY.md), decisions in [ADRs](../adr/README.md), named claims and gates in the [qualification plan](../plan/bootstrap/06-qualification-gates.md), and guides that point to exemplars. Its glossary explicitly says patterns do not nest: one pattern **builds on** another. A generic parent/child presentation must not silently replace that rule.

The current glossary also exposes a concrete mismatch with a note graph. Terms such as Datom, Changeset, Manifest and Basis are bold entries within a shared Markdown document, not one note or heading per term. Treating files as concepts would yield one giant glossary node. Splitting canonical prose just to satisfy a graph tool would change the authoring model. A derived term index or generated note per term is a better hypothesis to explore first. [Glossary source](../../GLOSSARY.md)

The following relationship vocabulary is a **proposal for the discussion artifact**, not an accepted schema:

| Relationship | Intended meaning | Candidate source |
| --- | --- | --- |
| Defines | A canonical document supplies a concept's definition | Glossary entry or owning guide |
| Uses term | A particular passage uses that concept | Parsed source occurrence |
| Builds on | One pattern depends on another pattern's contract | Explicit guide declaration |
| Implements | Code supplies a contract | Exemplar or implementation declaration |
| Checks / establishes | A suite checks a contract; a gate establishes a named claim | Qualification plan and evidence |
| Explains decision | An ADR records a choice and its rationale | ADR |

“Uses term” can be extracted mechanically. “Builds on” and “implements” need an explicit authoritative declaration; text proximity and link direction alone are insufficient. A source locator should accompany each relation so a reader can inspect why the edge exists. These are proposed maintainability rules, consistent with the existing single-source approach, rather than claims about current tooling.

For the first view, Changeset is a useful focus. Its definition can sit beside connections to Manifest, Basis, Commit datom and Datom. The named P05 claim can provide a route to evidence. Each connection needs an exact label: a Manifest describes a Changeset's expected members; it is not automatically a “child concept” in every domain sense. The [glossary](../../GLOSSARY.md) and [P05 specification](../plan/bootstrap/06-qualification-gates.md) supply the meanings. The graph should retain the distinction between a claim, historical evidence and current qualification status.

## A bounded next experiment to discuss

**Recommendation:** compare navigation with the same small, sourced concept set before adopting a graph editor or changing docs structure.

1. Select 15-25 terms around Datom, Changeset and the log store, plus the relevant guide, decision and claim records.
2. Retain canonical prose in the repo. Give derived nodes stable identities and source locators; derive inverse and sibling views instead of maintaining duplicate relations.
3. Show one concept with a definition panel, labelled relationship groups, search, back/forward navigation and an ordinary list alternative.
4. Try three questions with a newcomer: “What does Changeset mean?”, “Where is it used?”, and “What supports its promise of atomic visibility?”
5. Change a definition and move a source file. Check whether the view updates correctly and whether dangling or ambiguous relationships become visible.

Candidate comparison: K-Plex in a disposable generated Obsidian vault; TheBrain as an interaction reference or import target; a repo-derived browser view integrated with the docs site. The browser view is my leading hypothesis for reader access and canonical-source maintenance. K-Plex is the quickest concrete way to evaluate the spatial model with a real editor. Quality of semantics, navigation and change maintenance should decide, not the amount of implementation work.

Open questions for discussion are who primarily reads the graph, whether it is initially read-only, which two or three relationship families deserve permanent screen regions, and whether terms or pages should be the initial navigation unit. Keyboard navigation, small-screen readability, large-degree nodes, MDX handling, rename behavior and exact-version performance remain unmeasured.
