# I25: Ideas batch: understanding and maintaining code bases

Status: needs-triage

Category: enhancement

Found: 2026-10-03

Series: ideas-batch, second batch: `ideas-batch-understanding-and-maintaining-code-bases`

## What

Tools such as repowise, ripwire, LikeC4, archify, Bausteinsicht and draw.io help people and agents understand and maintain a code base, and this issue collects them, together with the ideas of the original vivief repo, as the starting point for a wayfinder session on how ViViEfs explains and keeps track of itself. vivief already built a part of this (DevAC: a code graph, effects extracted from code, C4 views made from those effects, an MCP server), and ViViEfs took only the datom and effect handler ideas from it so far. The issue also collects ideas on how to show what we learn: animated diagrams as a lesson viewer, notebooks, and live diagrams of a running system made from its logs, traces and metrics. A possible entry concept: design from code, truth from OTel. The scope is broad on purpose: the wayfinder session names the destination and finds the way. This issue does not decide anything. Read it with I24, the first issue in the ideas-batch series.

## Sources

Copied on 2026-10-03. The three repowise blog posts are written by the repowise team (dated 2026-05-20) and compare other tools with their own product, so read their conclusions as a vendor's view.

### Code and architecture tools

| Source | What it is | License |
| --- | --- | --- |
| [repowise](https://github.com/repowise-dev/repowise) | Indexes code, dependency graph, git history, tests, docs and decisions once, then answers people and agents with citations. Five layers: dependency graph (AST, 26 languages, confidence per call), git intelligence (hotspots, ownership, co-change), a generated wiki with a freshness score, code health (53 deterministic detectors), and decisions found in source and git history. Ten task-shaped MCP tools (`get_overview`, `get_context`, `get_risk`, `get_health`), blast radius per symbol, tests inferred from the graph, dead code, and a PR bot without an LLM. Runs locally. | AGPL-3.0, commercial license too |
| [LikeC4](https://likec4.dev/) ([repo](https://github.com/likec4/likec4)) | Architecture as code: one model in a DSL, many views of it at different levels, inspired by C4 and Structurizr but with your own element kinds and any depth. Interactive diagrams, drill-down, dynamic views, a VS Code extension, a Vite plugin, React and web components, an MCP server, and diff and validation to catch drift between model and system. | MIT |
| [Bausteinsicht](https://github.com/docToolchain/Bausteinsicht) | Architecture as code from the docToolchain project, with draw.io as the visual editor and sync in both directions: change the model and the diagrams follow, move boxes in draw.io and the change goes back to the model. One model in JSONC with a JSON Schema, many views (context, container, component) with scope and filters, relations lifted to the nearest visible element when an end is not in a view, an LSP, and `--format json` on every CLI command so agents can change the architecture. Documented in arc42. | MIT |
| [archify](https://github.com/tt-a1i/archify) | An agent writes a typed JSON source for one of five kinds of diagram (architecture, process, sequence, data flow, lifecycle), validators check schema, layout and output before delivery, and it renders to one self-contained interactive HTML file, with PNG and video export. Focus and path tracing use only the relations the author wrote; it never guesses topology. | MIT |
| [ripwire](https://github.com/redhat-et/ripwire) | "The ripgrep of AI context": a C++23 CLI and MCP server with no runtime dependencies, from Red Hat's emerging technologies group. It parses 25+ languages and Markdown into a local index (no embeddings, no index server, no daemon) and answers an agent in one call: ranked signatures for a task (`--for`), who calls a symbol and its blast radius (`--impact`), the tests to run (`--test-gate`), quality before and after a change (`--quality-delta`), and the sections of the repo's documents that answer a question (`--recall`). Agents can pin notes to symbols. Its rules: answer completely in one call, label every guess, and disclose every cap and every part left out ("honest-partial answers"). CLI first, MCP second, because the CLI is cheaper. v0.6.5, about 2,400 stars. | Apache-2.0 |
| [Best architecture documentation tools](https://repowise.dev/blog/comparisons/best-architecture-documentation-tools) | repowise, Structurizr, IcePanel, Mermaid, PlantUML. Architecture docs need three things: C4 views, ADRs and live system diagrams. The key choice is whether the source of truth is a document (kept by hand) or the repo (generated). | |
| [Best code search tools for teams](https://repowise.dev/blog/comparisons/best-code-search-tools-teams) | Sourcegraph, Greptile, repowise, GitHub Code Search, Zoekt, compared on index freshness, exact and semantic search, cross-repo, history and diffs, and APIs or MCP for agents. | |
| [Best codebase documentation tools for AI agents](https://repowise.dev/blog/comparisons/best-codebase-documentation-tools-ai-agents) | repowise, DeepWiki, Mintlify, the index in [Cursor](https://cursor.com), Greptile. Hand-written Markdown ages out as agent input; agents need a short overview, a dependency path, risk and ownership, and decision history on request (MCP), not a dump of all docs. | |

### Why Bausteinsicht: references

[Bausteinsicht ADR-001, DSL format](https://github.com/docToolchain/Bausteinsicht/blob/main/src/docs/arc42/ADRs/ADR-001-DSL-Format.adoc) scores six formats for the model: JSONC with JSON Schema (+20, chosen), PlantUML C4 (+2), a TypeScript DSL (0), a custom Langium DSL (0, the baseline), LikeC4 (-9) and Structurizr (-10). The reasons that matter here:

- **References by id.** Elements are nested, and relations name their ends by string id (`"from": "webshop.api"`). The ADR names this as a cost: no variables and no direct object references. It is also what makes the model easy to check, the way the docs site already turns `D31`, `ADR-0029`, `P05` and `I22` into named links and fails the build on an unknown id (D87). An architecture element could be one more kind of reference: named in prose, linked to its view, its code and its evidence, and checked by `verify`.
- **Sync in both directions.** LikeC4 and Structurizr were rejected because their DSL is the only source; draw.io edits cannot flow back. Bausteinsicht keeps one model and lets the human edit either side.
- **Made for agents.** "LLMs generate JSON more reliably than any other format", JSON Schema gives completion and validation in every editor for free, and a compact syntax can be added later as a converter.

### Diagrams with draw.io

| Source | What it gives | License |
| --- | --- | --- |
| [draw.io](https://www.drawio.com/) ([repo](https://github.com/jgraph/drawio)) | The diagram editor that Bausteinsicht uses. It runs on the desktop, in the browser and as a self-hosted Docker image, and its files are XML stored next to the code. | Apache-2.0 |
| [Integrations](https://www.drawio.com/docs/integrations/) | Inspiration for where diagrams can live: VS Code, GitHub, Confluence and Jira, Notion, Google and Microsoft Office, JupyterLab (diagrams next to runnable code), Grafana, MediaWiki, Nextcloud where several people edit at once, and an embed mode for other programs. | |
| [Page animations](https://www.drawio.com/docs/manual/links-tooltips-tags/page-animations/) | A sequence of steps attached to a page (show, hide, highlight shapes, layers or tags, with delays), saved in the diagram's XML and played in the lightbox viewer and in presentation mode. A step-by-step story told on one diagram. | |
| [Online diagram viewer](https://www.drawio.com/docs/getting-started/online-diagram-viewer/) | Opens a diagram from a URL as full screen, editor or embed (iframe), and plays its animations by default. A shareable viewer for a diagram that lives in the repo. | |
| [Editor themes](https://www.drawio.com/blog/diagram-editor-theme) | Minimal: panels collapse and float over the canvas, little chrome. Sketch: few tools and a rough hand-drawn style, like a whiteboard. Ideas for a review or lesson surface that keeps the diagram in front, and for a style that says "this is a draft". | |

### Live diagrams of a running system

| Source | What it is | State |
| --- | --- | --- |
| [grafana-flowcharting](https://github.com/algenty/grafana-flowcharting) | A Grafana panel that shows a draw.io diagram and colors, animates and links its shapes from live metrics, through rules that map series to shapes. | Unmaintained: last release 0.9.0 in 2020, last commit in 2023, Angular, which Grafana 12 no longer runs. Apache-2.0. The idea is what we keep. |
| [Grafana Canvas panel](https://grafana.com/blog/canvas-panel-in-grafana-create-custom-visualizations-with-all-the-latest-features) | Built into Grafana: elements placed by hand, connections between them, colors and text bound to live queries. | Maintained. |
| [Grafana Graphviz panel](https://grafana.com/grafana/plugins/grafana-graphviz-panel/) ([introduction](https://grafana.com/blog/how-to-visualize-workflows-and-business-processes-in-grafana-introducing-the-graphviz-panel)) | A diagram in the DOT language, laid out automatically, with node colors, labels, edge widths, tooltips and links driven by live queries from any Grafana data source. Three input modes: builder (visual, no code), code (DOT) and query (the diagram comes from a data source). Grafana names FlowCharting as no longer maintained. | Private preview: version 0.0.7 (2026-08-17), Grafana 12.3 or later, not for production, no SLA. AGPL-3.0, by Grafana Labs. |
| Service graphs from traces | The OpenTelemetry Collector's service graph connector, Tempo's metrics generator and Jaeger's dependency view build a map of who calls whom, with rates, errors and latency, from the spans themselves. | Maintained. otel-lgtm (Grafana with Tempo) and Jaeger are already lab images here (D45'). |

### The Graphviz panel: one picture to explain and to monitor

The [plugin page](https://grafana.com/grafana/plugins/grafana-graphviz-panel/) gives three reasons for the panel under "Why Graphviz panel", and each one names an idea of this issue:

| The plugin's reason | In this issue |
| --- | --- |
| "Map metrics to your mental models." Grafana is good at time series, but "operational insights often live in relationships between things". | The picture is the goal: the shape a reader keeps in mind, with the numbers on it. |
| "Diagrams as code." Define once, reuse everywhere. | A small text file in the repo that an agent writes, a check reads, and a model's ids can name (References). |
| "Data-driven diagrams." Color nodes by health thresholds, update labels with live values, scale edge widths by throughput. | Truth from OTel, shown on the design picture. |

Its three input modes match three sources of a picture: builder mode is drawn by a human (as in draw.io), code mode is written as DOT in the repo, and query mode is generated from data (from a model, the code or the datom log).

The [introduction post](https://grafana.com/blog/how-to-visualize-workflows-and-business-processes-in-grafana-introducing-the-graphviz-panel/) (2026-08-11) shows eight diagrams, each a short DOT file with live data bound to it:

| Example | What it shows | What is live |
| --- | --- | --- |
| Payment flow | checkout, authorization, fraud check, settlement, payout | node color by health threshold, throughput on the edges, "1,240 tx/min" and "99.2% success" in the labels |
| Service map | services and who calls whom | fill color by health, edge width (`penwidth`) by request rate, rate and latency in the labels |
| Network weathermap | sites and the links between them, laid out by `neato` | link color and label by utilization, site color by health |
| Incident runbook | a tree of branches to follow during an incident | mostly fixed; "the branch that currently applies lights up" |
| CI/CD pipeline | build, test, security scan, deploy to staging, deploy to production | stage color by status, duration and counts in the labels |
| Telemetry pipeline | node_exporter to Alloy to Grafana Cloud (metrics, logs, traces) | labels from live queries; the traces node showed "0 spans/s" in grey, which told them tracing was idle |
| Host health | CPU, memory, disks and network around one host | each part colored by its threshold, recolored on its own when load went up |
| Customer ladder | customers grouped by number of orders | counts from a live query on every load |

How data reaches the picture: color by threshold (Grafana's own thresholds), `${field}` values in labels, edge width scaled to throughput, tooltips and links that drill down into the dashboard behind a node, dashboard variables (`${service}`, `${env}`) so one diagram serves many teams, and a query mode where a query returns the DOT text itself ("Your infrastructure describes its own picture"). Layouts: `dot` for flows top-down or left-right, `neato` and `fdp` for networks, `circo` for circles.

The post binds the picture to Grafana queries, mostly metrics; it does not read traces or Tempo directly. OTel reaches it as metrics: span metrics and service graph metrics from traces, or the collector's own metrics, as in the telemetry pipeline example.

The idea to keep: the picture is the goal. One simplified, intuitive diagram per flow that is right for explaining the flow and for monitoring it, so a reader learns the same picture an operator watches. The DOT file is small text in the repo that an agent can write and a check can read, and its nodes could be the same ids as the design model's elements (see References below). The panel is one way to show the picture live, and it is a private preview under AGPL-3.0. DOT itself is not tied to it: [Graphviz](https://graphviz.org/) (EPL-2.0) or its WebAssembly build (`@hpcc-js/wasm-graphviz`) can draw the same file on the docs site, without the live data.

## What vivief already had

The original repo, [vivief ("Vision View Effect")](https://github.com/pietgk/vivief) (`~/ws/vivief`, home of DevAC), overlaps with these tools in most places:

- **The core formula.** `effectHandler = (state, intent) => (state', [intent'])`, which we now say as `(Context, Intent) => (Context', [Effects])`. vivief: "This is the entire pattern"; HTTP, state machines, routing and code analysis all map to it ([foundation](https://github.com/pietgk/vivief/blob/main/docs/contract/foundation.md#5-effects-the-universal-abstraction) section 5, [effectHandler](https://github.com/pietgk/vivief/blob/main/docs/claude/concepts-effecthandler.md)). Effects are data, and "observability is projection over effect datoms".
- **Vision and View as a loop.** Vision is the why (specs, intent, architecture); View is the what, where, when and how (code, diagrams, tests). Code is extracted into effects, effects are presented as diagrams and views, and views are validated against the vision ([foundation](https://github.com/pietgk/vivief/blob/main/docs/contract/foundation.md#3-vision--view-the-core-loop) section 3).
- **Rules that lift effects.** Rules turn low-level effects (a function call in a file under `routers/`) into high-level ones (a service), and that makes C4 views, domain effects and drift detection possible: a rule that should match but does not is drift. LLMs propose rules, humans accept them, systems run them.
- **Two worlds.** Push as much as possible into the deterministic world (extraction, validation, diagram generation), so humans and LLMs work on what is not deterministic (intent, design, decisions).
- **DevAC as a tool.** Tree-sitter parsing of TypeScript, Python and C# into a code graph (nodes, edges, effects) in DuckDB and Parquet, watch mode, cross-repo queries through a hub, an MCP server with 21 tools, and C4 diagrams generated from effects with LikeC4 as the default format (vivief's decision [LikeC4 as the primary format](https://github.com/pietgk/vivief/blob/main/docs/contract/adr/0027-likec4-primary-format.md) and its [Views](https://github.com/pietgk/vivief/blob/main/docs/fact/devac/views.md) page). vivief also wanted to match OTel traces against the extracted effects. ripwire is a more complete, measured version of several of these ideas (a code graph, impact, tests to run, recall over documents), without the effects and C4 views.
- **Docs for agents and for humans.** Short "Claude windows" (50-80 lines with a `last-verified` date) that link to the full human version; docs ordered as intent, contract, fact ([vivief docs](https://github.com/pietgk/vivief/blob/main/docs/README.md)).

## What ViViEfs has today

- **Taken from vivief**: the datom (D31) and a command as a pure function `(readModel, intent) -> changeset or DomainError` (D36, `GLOSSARY.md`), which is the core formula in this stack's words. Traces derived from the log (D32). `docs/plan/bootstrap/09-sources-to-reuse.md` lists vivief for concepts v6, the datom sync ADR and the idea to match traces against extracted effects later.
- **Understanding**: `AGENTS.md` as a map, `GLOSSARY.md` with hover links (D94), guides with a fixed template, ADRs and the decision log, references resolved and checked when the site is built (D87), the generated Claims page (D93), `llms.txt` (D61), Mermaid with integrity checks, Lavish review pages as research records (D68), the K-Plex concept navigation research (2026-10-02), and the Nx project graph.
- **Maintaining**: `verify` with one file treatment per production file (evidence registry), the coverage ratchet, the guide template check, gates and the ledger, and skills pinned in `skills-lock.json`.
- **Running system**: the telemetry sink pattern with motel, Jaeger and otel-lgtm (D45'), durable spans derived from the log, and the trace projector.
- **Not taken**: no code graph, no effects extracted from code, no C4 or architecture model, no MCP server about the repo itself, no freshness check that a doc still matches the code, no hotspot or ownership view, no rules that lift effects into architecture, no diagram of the running system, no notebooks.

## An entry concept: design from code, truth from OTel

Two sources could meet in one model. Design comes from the code: the architecture the code says it has (services, layers, commands, workflows, the effects each one may produce). Truth comes from OTel: what the running system did (spans, logs, metrics, and in this stack the datom log that the durable spans are derived from). Put the two side by side and you get:

- **Drift**: a call or an effect that runs but is not in the design, or a part of the design that never runs.
- **A live diagram**: the design diagram as one goal picture, colored and animated by what the system does now (the grafana-flowcharting idea, on Canvas, Graphviz or a service graph), the same picture for explaining and for monitoring.
- **A lesson**: the same diagram played step by step for one request (a draw.io page animation, or a recorded trace replayed), as the viewer that the explainer videos in I24 point at.

This may be the place to start the session: it ties vivief's Vision - View - Effects loop, the architecture tools above, and the observability this stack already qualifies into one question.

## Starting point for the wayfinder session

The wayfinder session names the destination first, with the human. Candidates to start the grilling from (none is chosen):

- A decision on which parts of vivief's Vision - View - Effects loop ViViEfs adopts, and in which form (a pattern with a guide, a tool, or a practice).
- A spec for one architecture model of ViViEfs (LikeC4, Bausteinsicht or another) that the docs site renders and `verify` checks against the code, with its elements as references.
- A spec for "design from code, truth from OTel": the design model, the run-time view, and how the two are compared.
- A spec for how an agent gets context about this repo (MCP, generated pages, the current map), and how that context stays fresh.

Fog to chart, in no order:

- **Why.** Who loses the thread today (a newcomer, the reviewing human, an agent), where, and what it costs. This decides how much of the rest is worth it.
- **Source of truth.** Generated from the repo, written by hand, a model checked against the repo (LikeC4 drift checks, vivief rules), or a model edited on both sides (Bausteinsicht and draw.io). How does that fit D30 (one source) and D68 (research is never the source of a claim)?
- **References.** Should architecture elements be ids that prose, guides, views, code and evidence name, resolved and checked like D87 references? What is the id scheme, and how does it relate to entity ids and pattern names?
- **Effects in code.** Can effects be extracted from Effect code (services, layers, commands, workflows, activities), where types already say a lot? Does `(Context, Intent) => (Context', [Effects])` hold for the whole stack, and should it be a glossary term?
- **Truth from OTel.** Which signals show the running system best (durable spans from the log, live spans, metrics, service graphs), where the live diagram is shown (Grafana in otel-lgtm, the docs site, the app), and how design and run time are joined (by name, by id, or by the keys on spans and logs).
- **Views.** C4 levels, dynamic views of a workflow, sequence diagrams of sync: which ones a reader needs, and whether they come from a model, from code, or from the datom log at run time (D32). Mermaid stays, or draw.io, LikeC4 or Graphviz join it, and for which kind of view.
- **One picture to explain and to monitor.** Which flows of this stack deserve one goal picture in the style of the Graphviz panel examples (for example sync from the outbox to the server and back, a durable workflow and its activities, the IntentComposer, the `verify` stages, the telemetry sinks themselves), what is live on each, and whether the same picture is shown in a lesson on the docs site and on a dashboard in otel-lgtm.
- **Editors and viewers.** draw.io as an editor next to the code (VS Code, desktop), its embed mode and online viewer for the docs site, and what the Minimal and Sketch themes suggest for our own review and lesson surfaces: less chrome, the diagram in front, a rough style for drafts.
- **Lessons as animated diagrams.** A lesson viewer that plays a pattern or a gate one step at a time (draw.io page animations, a replayed trace), as a cheaper and checkable step towards the explainer videos in I24. How it cites evidence, and how it stays true when the code changes.
- **Notebooks.** Where a notebook fits and adds value: exploring the datom log or traces, a lesson that runs its own code, a design review with live queries. Which notebook (JupyterLab, which already embeds draw.io, or a TypeScript one), and how it relates to exercises and guides.
- **Notebook or chat.** The IntentComposer as a block in a notebook or a block in a chat, where the line between the two blurs: a chat is a notebook that grows by turns, a notebook is a chat you can rerun. What that means for the IntentComposer's three parts (composing, reviewing, submitting) and for how an agent and a human build an intent together.
- **Agents.** An MCP server about the repo, generated short context pages like vivief's Claude windows, or the current `AGENTS.md` map and skills. How each one is kept fresh.
- **Maintenance signals.** Hotspots, ownership, co-change, blast radius, dead code, drift. Which of them `verify` should own, and which stay advice.
- **Build, reuse or adopt.** Reuse DevAC from vivief, use ripwire (Apache-2.0) to extract knowledge from code and documents, adopt repowise or the Graphviz panel (both AGPL-3.0: check what that means for this repo; the panel is also a private preview), LikeC4, Bausteinsicht or archify (MIT), draw.io (Apache-2.0), Graphviz (EPL-2.0), or build a small part ourselves. ADR-0029's reference subtree is one model for reading another repo.
- **Teaching.** How architecture views link into guides, lessons and the K-Plex style concept navigation, and what I22 (claims and evidence levels) and I24 (output formats for understanding) add.

## Comments
