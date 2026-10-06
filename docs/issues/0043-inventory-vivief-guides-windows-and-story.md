# I43: Inventory vivief's guides, agent windows and story

Status: resolved

Category: enhancement

Effort: docs/plan/vivief-inventory/

Type: research

Blocked by: I35, I36

Found: 2026-10-05

Claimed: 2026-10-06

## What

Where do vivief's guides, its agent windows and its story stand in ViViEfs? Read, under `~/ws/vivief/docs/`, `README.md`, `fact/guides/` (10), `fact/workflow/`, `fact/reference/`, `fact/datom-store/`, `claude/` (20 agent windows), `story/` (the arc and 6 evolution logs) and `agents/` (3), about 9,500 lines. The agent windows mostly summarize ideas already indexed; record the window format itself (50-80 lines per topic, linking its human version) as an idea next to ViViEfs's `AGENTS.md`, skills and `llms.txt`. The story's evolution logs say where vivief changed its mind: cite them on rows where that matters.

Write its rows file, `I43.md` in `docs/plan/vivief-inventory/rows/`, in the row format of the [map](../plan/vivief-inventory/map.md) (Notes: one table, two sides; where an idea stands; citations; ids), with a coverage line for every source listed here, and link it from the answer. Reuse the ids of I35 (vivief) and I36 (ViViEfs) where the idea is indexed; add new ids otherwise. Record and ask; do not decide what ViViEfs adopts.

## Answer

[19 rows](../plan/vivief-inventory/rows/I43.md) and a coverage line for each of the 46 files in the slice (9,656 lines; the ticket says about 9,500): 6 `taken`, 12 `different`, 1 `missing`. 18 rows are reference stack, 1 DevAC tooling; the reference-stack rows go to map 6 (5), maps 2 and 4 (4 each), map 3 (3) and map 5 (2). 11 ids are new; 8 refine an earlier row (3 from I35, 2 from I38, 2 from I40, 1 from I36), which I45 merges. Half the agent windows feed no row: they summarize ideas already indexed, and the coverage table names the ids each restates.

The two stacks meet on how agents are set up: the same vendored skills read through the same three adapter files in `docs/agents/` (the triage labels byte-identical), where ViViEfs's lock pins each skill to an upstream commit and vivief's is the kind ADR-0027 replaced; CLIs before MCP; a concrete app as the test of a concept (D23, D55); DuckLake as an analytics projection (D37). They part on agent context: vivief writes a 50-80 line window per topic beside its human version, where ViViEfs keeps one source and generates `llms.txt` from it (D30, D64), and the windows have drifted, the case D30 names. They part on how a check comes in: vivief phases one in with warnings, thresholds and opt-outs per story, where every ViViEfs check passes or fails and the evidence lockfile is its one ratchet. And they part on how a change of mind is kept: vivief archives old versions and keeps an evolution log per topic, where ViViEfs primes a decision or supersedes an ADR in place. Search over the analytics store is the one gap.

The story says where vivief changed its mind: DevAC from a tool to a domain; the concepts from seven to five, after reviews named surface-area growth the biggest risk; effects from what code does to what a handler produces; the code graph's tables into datoms; and the peer-to-peer stack three times in about two months, though its ADRs chose the final protocol from day one. The windows have drifted from their human versions: three list Surface modes that are not v6's, two point at human versions that have moved, one derives keys per Projection where v6 derives them per entity, and three give three scales for a trust score. The guides disagree with `fact/devac/` on the hub's path, the MCP tool names and the eval framework's model client, and with the validation intent on `--push-to-hub`; many of their links point at vivief's old layout.

Not settled, for I45: `vivief:agent-context-windows` is `different`, which a strict reading of D30 makes `rejected`; `vivief:cross-domain-references` is `missing` in I38 and `different` here, because the window adds attribute namespaces, which ViViEfs has; `vivief:final-protocol-from-day-one` stays `taken` as in I40, though vivief's own log shows its final protocol changing; `vivief:vendored-skills-and-adapters` is `taken`, though the issue trackers differ (GitHub against files, D92). Further possible merges are in the rows file's Notes.

## Comments
