# Issue tracker: committed Markdown in `docs/plan/`

Specs and tickets for this repo are Markdown files committed under
`docs/plan/<effort>/`, next to the Schedule they serve
([10-open-items-and-risks.md](../plan/bootstrap/10-open-items-and-risks.md)).
GitHub Issues are not the tracker: the repository is public, so nothing is
posted there without asking the human first.

## Conventions

- One effort per directory: `docs/plan/<effort-slug>/`, where the slug names the
  Schedule step or gate (for example `p12-p13-app-shell`).
- The spec is `docs/plan/<effort-slug>/spec.md`.
- Tickets are one file each at `docs/plan/<effort-slug>/issues/<NN>-<slug>.md`,
  numbered from `01` in dependency order, never one combined file.
- A `Status:` line near the top holds the triage role (see
  [triage-labels.md](triage-labels.md)), or `claimed` / `resolved` for wayfinder
  tickets.
- A `Blocked by: NN, NN` line near the top lists blocking tickets. A ticket is
  unblocked when every file it lists is `resolved`.
- Conversation appends to the bottom of the file under `## Comments`.
- Decisions that come out of a spec or ticket still go to the decision log and
  ADRs ([domain.md](domain.md)); the ticket links them instead of restating them.

## When a skill says "publish to the issue tracker"

Create the file under `docs/plan/<effort-slug>/`, creating the directory if
needed, and link the effort from the Schedule row it belongs to.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The human normally passes the path or the
ticket number within an effort.

## Pull requests as a triage surface

**PRs as a request surface: no.** Issues and pull requests that other people open
on GitHub are read with `gh`; triage records its outcome in a file here.

## Wayfinding operations

Used by `/wayfinder`. The map is a file with one child file per ticket.

- **Map**: `docs/plan/<effort-slug>/map.md` (Destination, Notes, Decisions so
  far, Not yet specified, Out of scope).
- **Child ticket**: `docs/plan/<effort-slug>/issues/NN-<slug>.md`, with the
  question in the body and a `Type:` line (`research`, `prototype`, `grilling`
  or `task`).
- **Frontier**: the ticket files that are open, unblocked and unclaimed; the
  lowest number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under `## Answer`, set `Status: resolved`, then
  add a one-line pointer (gist and link) to the map's Decisions so far.
