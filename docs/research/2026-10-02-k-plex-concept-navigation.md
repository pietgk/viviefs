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

## Follow-up, 2026-10-02: architecture browsing is the first experiment

The discussion identified two different uses: teaching a reader a concept, and exploring the architecture of the complete repository. The user's preferred next step is an **actual K-Plex experiment in an isolated, generated Obsidian vault**, with ideas borrowed from C4. Future exports could support other vaults and viewers. Integrating an open-ended graph into a lesson remains a separate pedagogical question. This supersedes the initial preference above for starting with a docs-site concept navigator; the earlier analysis is retained as research context.

### What to borrow from C4

C4 distinguishes a software system, its runtime applications and data stores, the functional components inside those runtime units, and code elements implementing those components. Its diagrams offer different levels of detail for different audiences; using every level is optional. [C4 abstractions](https://c4model.com/abstractions), [C4 diagrams](https://c4model.com/diagrams)

An Nx project or directory must not automatically become a C4 container or component. C4 containers describe runtime applications or data stores. Components group functionality behind an interface within a container; packaging and folders are a different concern. An application can compose code from several repository projects, and one library can contribute to several runtime compositions. [Container definition](https://c4model.com/abstractions/container), [Component definition](https://c4model.com/abstractions/component)

The useful C4 disciplines are explicit scope, types, concise responsibilities, meaningful directed relationship labels and communication protocols. The official notation guidance permits interactive alternatives to conventional diagrams. Runtime interaction order belongs in a separate dynamic view when it adds explanatory value; it must not be inferred from the static import graph. [Notation](https://c4model.com/diagrams/notation), [Dynamic diagrams](https://c4model.com/diagrams/dynamic)

**Proposed export views:** a runtime architecture view; a repository-project dependency view; a pattern/contract/implementation view; and a decision/claim/evidence view. Let readers cross between them through explicit mappings. ViViEfs remains the repository/reference stack in the glossary, rather than being relabelled a single deployed business system. Runtime mappings need inspection of the relevant app compositions.

“Complete repository” should mean navigable coverage with a visible inventory, not every file simultaneously on screen. The export should state what it includes, what it excludes, and the revision it represents. Vendored reference repositories, dependencies and generated output need explicit scope labels so their presence does not imply that ViViEfs owns their architecture. This is an experiment design proposal, not an accepted classification.

### Concrete K-Plex release contract

The follow-up inspected the **0.0.5 release**, commit `3ac122e95baf77498f2b2270894519d8178361fe`, rather than relying on newer main-branch code. Its manifest requires Obsidian 1.13.0 or later and identifies the plugin as `k-plex`. [Release manifest](https://github.com/zsviczian/kplex/blob/3ac122e95baf77498f2b2270894519d8178361fe/manifest.json)

The release recognises these example field names without custom ontology configuration:

| Spatial role | Example default YAML keys |
| --- | --- |
| Parent | `Parent`, `Parents` |
| Child | `Child`, `Children` |
| Friend | `Friend`, `Friends`, `Jump`, `Jumps` |
| Challenger | `Challenger`, `opposes` |
| Previous | `Previous`, `Prev`, `Before` |
| Next | `Next`, `After` |
| Hidden | `hidden` |

These are examples from longer alias lists. Defaults also recognise broad words such as `source` as a parent field, so blindly exporting arbitrary metadata keys can have unintended semantics. Custom fields are assigned through `hierarchy.parents`, `children`, `leftFriends`, `rightFriends`, `previous`, `next`, `hidden` and `exclusions`. Ontology arrays replace the corresponding defaults during settings merging. [Release settings](https://github.com/zsviczian/kplex/blob/3ac122e95baf77498f2b2270894519d8178361fe/src/settings.ts#L49)

For a first exported note, the simplest explicit structure is:

```yaml
---
Parent:
  - "[[Repository projects]]"
Friends:
  - "[[Related decision]]"
source-path: "libs/example/project.json"
export-revision: "<repository commit>"
---
```

This is an illustrative generated note, not a claim that the example project exists. Quote wikilinks so YAML reads them as strings. The release's builder reads configured frontmatter fields and compatible inline fields, then extracts the link targets and records their declared roles. [Release graph builder](https://github.com/zsviczian/kplex/blob/3ac122e95baf77498f2b2270894519d8178361fe/src/index/GraphBuilder.ts#L1190)

Use parent/child for one clearly labelled organising relation per exported view. Preserve directed facts such as imports or runtime calls separately, with readable edge labels and source locators. Putting every dependency under Parent would blend containment with dependency. Mapping a custom field to a lateral role changes its placement but does not create a new logical inverse rule; the note and connection inspector must still make the direction comprehensible.

For a generated export, a candidate initial plugin configuration is `showInferredNodes: false`, `showFolderNodes: false`, `showTagNodes: false`, and an explicit ontology. This makes declared relationships the initial review surface. Release defaults instead show inferred nodes and infer ordinary links as children unless other inference settings apply. The experiment should test both declared-only browsing and an optional ordinary-link perspective. These settings are a proposal based on source inspection, not a runtime validation. [Release settings](https://github.com/zsviczian/kplex/blob/3ac122e95baf77498f2b2270894519d8178361fe/src/settings.ts#L233)

The release loads and merges its own plugin data through Obsidian's plugin API. Its desktop graph-opening command has the local ID `excalibrain-start`, despite the K-Plex name; with the plugin ID, the full command identifier is `k-plex:excalibrain-start`. [Release startup and commands](https://github.com/zsviczian/kplex/blob/3ac122e95baf77498f2b2270894519d8178361fe/src/main.ts#L117)

### Keeping the trial isolated and useful

An Obsidian vault is a folder with notes and vault-specific configuration. An existing export folder can be opened as a separate vault. Plugins are installed and enabled for that environment through its community-plugin settings. [Vault management](https://help.obsidian.md/Files+and+folders/Manage+vaults), [Community plugins](https://help.obsidian.md/Extending+Obsidian/Community+plugins)

Proposed trial boundaries:

1. Generate into a dedicated output folder, with no symlinks back to canonical repository documents. Keep source paths as navigational references.
2. Export stable node IDs, labels, types, relationships, provenance and the source revision before translating them into Obsidian notes. This preserves a route to other viewers without making K-Plex's spatial roles the canonical domain model.
3. Treat generated notes as disposable. Record any useful manually discovered relation in the appropriate repository-owned source or experiment input before regenerating; do not maintain competing copies of definitions.
4. Start at an overview with several named perspectives. Check that an architecture question can cross from app to composition, contract, implementation, source, decision and evidence.
5. Test a repository change and regenerate. Compare node/edge inventories and verify the affected neighbourhood. Include an intentional unresolved target to establish that missing coverage is visible.

Acceptance for this trial is practical: actual K-Plex opens the generated vault on a compatible Obsidian version; important relationships have understandable labels and sources; scope and unclassified items remain visible; and regeneration preserves usable navigation. The experiment's screenshots, installed versions and observed limitations should be recorded separately from these researched facts. This follow-up does not claim that the trial has run.

### Prepared export after the discussion

An isolated research export was prepared under `.lavish/k-plex/ViViEfs-Architecture-Trial`, with a throwaway exporter at `.lavish/k-plex/export_architecture.py`. It reads the repository at revision `78d63c80e` and produces 96 nodes and 198 directed relationships: all 26 owned project records, all 31 ADRs, 17 gates, seven selected terms, view/group nodes, and five runtime elements grounded in the inspected P11 lab composition. Declared package dependencies are labelled as declarations, not runtime calls. Individual source files, reference subtrees, installed dependencies and build output are outside this export.

The generated Markdown links resolve, and node filenames are unique. `graph.json` retains direction and provenance independently of the K-Plex presentation. `Generated/` contains source-derived notes; `Workspace/` is reserved for human exploration and is not rewritten by the exporter. K-Plex 0.0.5 release files were downloaded into this isolated vault, and Obsidian 1.13.7 was observed installed. Plugin rendering, navigation and rename/removal reconciliation are still unverified. This preparation is research scratch, not a production exporter or a completed runtime trial.

The architectural workspace should preserve proposed relationships in the human-owned area, with explicit distinction from extracted facts. Accepting a proposal means reviewing and recording it in the appropriate canonical repository source. Additional vaults should be scoped projections of the same sourced model where useful; implementing a general viewer framework before a second concrete use case would be premature.
