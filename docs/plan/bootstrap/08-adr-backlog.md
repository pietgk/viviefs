# ADR backlog

ADRs to write in `docs/adr/` during scaffolding. Each starts as "Proposed, unverified", names its qualifying gate,
and has expected vs observed outcome sections (complyj template). Grouped so that one ADR covers one decision cluster.

| ADR | Title | Decisions | Qualifying gate |
|---|---|---|---|
| 0001 | Record architectural decisions (template, status lifecycle, evidence links) | D48' | - |
| 0002 | ViViEfs purpose, scope and the evidence-collection exemplar | D1, D7, D23, D55 | - |
| 0003 | Effect v4 RC as the backbone; services and Layers are ports; Schema at every boundary | D8, D9 | P01 |
| 0004 | Expo SDK 58 and Hermes platform baseline, polyfills and Metro workaround | D22 | P01 |
| 0005 | SQLite drivers: official Effect drivers with expo-sqlite fallback | D16 | P02 |
| 0006 | One datom log as the substrate for journal, domain data, sync and tracing | D31 | P04 |
| 0007 | Hybrid logical clock for `tx` | D33' | P04 |
| 0008 | Single-datom transactions with changesets (manifest, basis, `cs == tx`, envelope per changeset) | D35'', D58 | P05 |
| 0009 | Per-attribute conflict policies | D34 | P05 |
| 0010 | Entity ids, defining attributes and strict-composition prefixes (`O{org}/`) | D38 | P05 |
| 0011 | Log store pattern, read models, compaction and analytics projection | D37, D44 | P04, P05 |
| 0012 | Durable execution: Effect Workflow API over one datom-backed engine | D2, D10, D39 | P06 |
| 0013 | Device durability: resume on launch, notifications, background sweep, browser leader tab | D3, D24, D25 | P07, P14 |
| 0014 | Leases, fencing and server authority | D13, D14, D15 | P09 |
| 0015 | Human steps as deferreds; workflows own progress, machines own interaction | D11, D40 | P06, P09 |
| 0016 | Commands, server validation and rejection | D36 | P09 |
| 0017 | Sync: outbox and cursor stream over Effect RPC (EventLog as reference only) | D21 | P09 |
| 0018 | Tracing derived from the log; telemetry sink pattern (motel, Jaeger, otel-lgtm) | D32, D45' | P03, P10 |
| 0019 | UI state ownership and live reads with query atoms | D41, D42 | P05, P08 |
| 0020 | Interaction state: outcome of the three-way prototype | D12 | P08 |
| 0021 | Files by content hash | D43 | P09 |
| 0022 | Identity and organization isolation | D18, D47 | P11 |
| 0023 | Data at rest and crypto-shredding | D50, D51 | P12, P13 |
| 0024 | Repository structure: apps, features, libs, tools; tags and rules; generators | D19, D52-D57 | verify (boundary lint) |
| 0025 | AI-robust guardrails: determinism lint, language service, exemplar-first | D26 | verify |
| 0026 | Verify - Qualify - Teach | D28-D30, D46, D48' | - |
| 0027 | Developer experience planes: skills, mise, Apple Container | D49 | - |
