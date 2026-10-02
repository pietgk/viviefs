# I22: Claims and evidence show each gate three times

Status: needs-triage

Category: enhancement

Found: 2026-10-02

## What

The docs site's Claims and evidence chapter shows each gate up to three times: its section on the generated Claims page, its row in the evidence index (`docs/evidence/README.md`), and its own dated evidence note (one per gate P01-P11), with closure notes and design reviews beside them. The overlap may confuse a reader about which one to read, and may drift, because the index and the notes are written by hand while the Claims page is generated (D93).

## Questions

- What does each of the three give a reader that the others do not: the claim and how it is proven (Claims), the list of runs (index), what one run showed (note)?
- Can the evidence index go, now that the Claims page lists every note per gate, or should the Claims page link to the index instead?
- Should a gate's notes appear under its claim in the sidebar, rather than as one long flat list?
- Seen from the whole picture: which levels of detail do we have (claim, gate, run, note, ledger entry), which do we want to present, and to whom (a newcomer, a reviewer, an agent), so that each level has one clear home?

The answer may change how the sidebar and the generated pages are built; decide it in a short design review before building.

## Comments
