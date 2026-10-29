# ADR backlog

ADRs to write in `docs/adr/` during scaffolding. Each starts as "Proposed, unverified", names its qualifying gate,
and has expected vs observed outcome sections (complyj template). Grouped so that one ADR covers one decision cluster.
This grouping is a scaffolding plan, not a grilled structure. [ADR-0008 Single-datom transactions with changesets][ADR-0008] also carries [D58 Envelope per changeset][D58].

| ADR | Title | Decisions | Qualifying gate |
|---|---|---|---|
| 0001 | Record architectural decisions (template, status lifecycle, evidence links) | [D48' Verify - Qualify - Teach][D48'] | - |
| 0002 | ViViEfs purpose, scope and the evidence-collection exemplar | [D1 A reference stack][D1], [D6 Earlier decisions carry over][D6], [D7 Its own repository][D7], [D23 Evidence-collection exemplar][D23], [D55 Exemplar first, product apps later][D55] | - |
| 0003 | Effect v4 RC as the backbone; services and Layers are ports; Schema at every boundary | [D8 Effect everywhere][D8], [D9 Effect v4, pinned][D9] | [P01 Platform on SDK 58][P01] |
| 0004 | Expo SDK 58 and Hermes platform baseline, polyfills and Metro workaround | [D22 Expo SDK 58][D22] | [P01 Platform on SDK 58][P01] |
| 0005 | SQLite drivers: official Effect drivers with expo-sqlite fallback | [D16 SQLite drivers][D16] | [P02 SQLite drivers][P02] |
| 0006 | One datom log as the substrate for journal, domain data, sync and tracing | [D31 One datom log][D31] | [P04 Log store conformance][P04] |
| 0007 | Hybrid logical clock for `tx` | [D33' Hybrid logical clock for tx][D33'] | [P04 Log store conformance][P04] |
| 0008 | Single-datom transactions with changesets (manifest, basis, `cs == tx`, envelope per changeset) | [D35'' Single-datom transactions with changesets][D35''], [D58 Envelope per changeset][D58] | [P05 Changesets and projections][P05] |
| 0009 | Per-attribute conflict policies | [D34 Per-attribute conflict policies][D34] | [P05 Changesets and projections][P05] |
| 0010 | Entity ids, defining attributes and strict-composition prefixes (`O{org}/`) | [D38 Entity ids and strict composition][D38] | [P05 Changesets and projections][P05] |
| 0011 | Log store pattern, read models, compaction and analytics projection | [D37 Log store tables][D37], [D44 Never rename, never migrate][D44] | [P04 Log store conformance][P04], [P05 Changesets and projections][P05] |
| 0012 | Durable execution: Effect Workflow API over one datom-backed engine | [D2 Temporal model][D2], [D10 Effect Workflow over our engine][D10], [D39 One engine everywhere][D39] | [P06 Workflow engine crash matrix][P06] |
| 0013 | Device durability: resume on launch, notifications, background sweep, browser leader tab | [D3 Resume on next launch][D3], [D24 Durable clocks and notifications][D24], [D25 Browser engine leader][D25] | [P07 Device resume E2E][P07], [P17 Workflow engine leader in a browser][P17] |
| 0014 | Leases, fencing and server authority | [D13 Server holds workflow state][D13], [D14 Leases with fencing][D14], [D15 Server authority after a lost lease][D15] | [P09 Sync][P09] |
| 0015 | Human steps as deferreds; workflows own progress, machines own interaction | [D11 Human steps as deferreds][D11], [D40 Server-side human steps][D40] | [P06 Workflow engine crash matrix][P06], [P09 Sync][P09] |
| 0016 | Commands, server validation and rejection | [D36 Shared commands][D36] | [P09 Sync][P09] |
| 0017 | Sync: outbox and cursor stream over Effect RPC (EventLog as reference only) | [D21 Sync as datom replication (superseded)][D21] | [P09 Sync][P09] |
| 0018 | Tracing derived from the log; telemetry sink pattern (motel, Jaeger, otel-lgtm) | [D32 Traces derived from the log][D32], [D45' Telemetry sink pattern][D45'] | [P03 OTLP and motel][P03], [P10 Trace projection][P10] |
| 0019 | UI state ownership and live reads with query atoms | [D41 Three state owners][D41], [D42 Live reads with query atoms][D42] | [P05 Changesets and projections][P05], [P08 UI three-way prototype][P08] |
| 0020 | Interaction state: outcome of the three-way prototype | [D12 Three-way interaction-state prototype][D12] | [P08 UI three-way prototype][P08] |
| 0021 | Files by content hash | [D43 Files by content hash][D43] | [P09 Sync][P09] |
| 0022 | Identity and organization isolation | [D18 Organization isolation on the server][D18], [D47 Identity via OIDC][D47] | [P11 Identity][P11] |
| 0023 | Data at rest and crypto-shredding | [D50 Data at rest on device][D50], [D51 Crypto-shredding][D51] | [P15 Encrypted store][P15], [P16 Crypto-shredding][P16] |
| 0024 | Repository structure: apps, features, libs, tools; tags and rules; generators | [D19 pnpm and Nx][D19], [D52 Four project kinds][D52]-[D57 Where docs and exercises live][D57] | verify (boundary lint) |
| 0025 | AI-robust guardrails: determinism lint, language service, exemplar-first | [D26 AI-robust guardrails][D26] | verify |
| 0026 | Verify - Qualify - Teach | [D28 Docs site like effect.website][D28]-[D30 One source for humans and agents][D30], [D46 Spikes are gates][D46], [D48' Verify - Qualify - Teach][D48'] | - |
| 0027 | Developer experience planes: skills, mise, Apple Container | [D49 Three developer-experience planes][D49] | - |

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0008]: ../../adr/0008-single-datom-transactions-with-changesets.md
[D1]: 02-decision-log.md#d1
[D10]: 02-decision-log.md#d10
[D11]: 02-decision-log.md#d11
[D12]: 02-decision-log.md#d12
[D13]: 02-decision-log.md#d13
[D14]: 02-decision-log.md#d14
[D15]: 02-decision-log.md#d15
[D16]: 02-decision-log.md#d16
[D18]: 02-decision-log.md#d18
[D19]: 02-decision-log.md#d19
[D2]: 02-decision-log.md#d2
[D21]: 02-decision-log.md#d21
[D22]: 02-decision-log.md#d22
[D23]: 02-decision-log.md#d23
[D24]: 02-decision-log.md#d24
[D25]: 02-decision-log.md#d25
[D26]: 02-decision-log.md#d26
[D28]: 02-decision-log.md#d28
[D3]: 02-decision-log.md#d3
[D30]: 02-decision-log.md#d30
[D31]: 02-decision-log.md#d31
[D32]: 02-decision-log.md#d32
[D33']: 02-decision-log.md#d33p
[D34]: 02-decision-log.md#d34
[D35'']: 02-decision-log.md#d35pp
[D36]: 02-decision-log.md#d36
[D37]: 02-decision-log.md#d37
[D38]: 02-decision-log.md#d38
[D39]: 02-decision-log.md#d39
[D40]: 02-decision-log.md#d40
[D41]: 02-decision-log.md#d41
[D42]: 02-decision-log.md#d42
[D43]: 02-decision-log.md#d43
[D44]: 02-decision-log.md#d44
[D45']: 02-decision-log.md#d45p
[D46]: 02-decision-log.md#d46
[D47]: 02-decision-log.md#d47
[D48']: 02-decision-log.md#d48p
[D49]: 02-decision-log.md#d49
[D50]: 02-decision-log.md#d50
[D51]: 02-decision-log.md#d51
[D52]: 02-decision-log.md#d52
[D55]: 02-decision-log.md#d55
[D57]: 02-decision-log.md#d57
[D58]: 02-decision-log.md#d58
[D6]: 02-decision-log.md#d6
[D7]: 02-decision-log.md#d7
[D8]: 02-decision-log.md#d8
[D9]: 02-decision-log.md#d9
[P01]: 06-qualification-gates.md#p01
[P02]: 06-qualification-gates.md#p02
[P03]: 06-qualification-gates.md#p03
[P04]: 06-qualification-gates.md#p04
[P05]: 06-qualification-gates.md#p05
[P06]: 06-qualification-gates.md#p06
[P07]: 06-qualification-gates.md#p07
[P08]: 06-qualification-gates.md#p08
[P09]: 06-qualification-gates.md#p09
[P10]: 06-qualification-gates.md#p10
[P11]: 06-qualification-gates.md#p11
[P15]: 06-qualification-gates.md#p15
[P16]: 06-qualification-gates.md#p16
[P17]: 06-qualification-gates.md#p17
