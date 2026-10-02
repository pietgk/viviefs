# Issue tracker: committed Markdown in `docs/issues/` and `docs/plan/`

Issues and tickets for this repo are Markdown files: one file per issue in
[`docs/issues/`](../issues/README.md) (D92), each with a global id like `I12`.
Specs and wayfinder maps stay with their effort in `docs/plan/<effort>/`, next
to the Schedule they serve ([10-open-items-and-risks.md](../plan/bootstrap/10-open-items-and-risks.md)).
GitHub Issues are not the tracker: the repository is public, so nothing is
posted there without asking the human first.

## Conventions

- An issue is `docs/issues/NNNN-short-title.md`, numbered from 0001 and never
  reused; its id is `I` plus the number without zeros (`0012-...` is I12).
  The format is in [docs/issues/README.md](../issues/README.md).
- A ticket that an effort's spec is broken into is an issue too, with an
  `Effort:` line naming `docs/plan/<effort-slug>/`. Number tickets in
  dependency order when they are created together.
- The spec is `docs/plan/<effort-slug>/spec.md`; the slug names the Schedule
  step or gate (for example `p12-p13-app-shell`).
- A `Status:` line holds the triage role (see [triage-labels.md](triage-labels.md))
  or `resolved`; a `Category:` line holds `bug` or `enhancement`.
- A `Blocked by: I3, I4` line lists blocking issues. An issue is unblocked
  when every issue it lists is `resolved`.
- Conversation appends to the bottom of the file under `## Comments`.
- Decisions that come out of an issue still go to the decision log and ADRs
  ([domain.md](domain.md)); the issue links them instead of restating them.
- In conversation and in the skills, "#42" means I42. In the docs write I42:
  a bare `#N` already names issues of other projects on GitHub.

## When a skill says "publish to the issue tracker"

Create the next numbered file in `docs/issues/` from the
[template](../issues/template.md), with `Effort:` when it belongs to one.

## When a skill says "fetch the relevant ticket"

Read the file `docs/issues/NNNN-*.md` of the id. The human normally passes
the id (I12, or "#12").

## Pull requests as a triage surface

**PRs as a request surface: no.** Issues and pull requests that other people open
on GitHub are read with `gh`; triage records its outcome in a file in
`docs/issues/`.

## Wayfinding operations

Used by `/wayfinder`. The map is a file in the effort; its tickets are issues.

- **Map**: `docs/plan/<effort-slug>/map.md` (Destination, Notes, Decisions so
  far, Not yet specified, Out of scope).
- **Child ticket**: an issue in `docs/issues/` with `Effort:` naming the
  effort, the question in the body and a `Type:` line (`research`,
  `prototype`, `grilling` or `task`).
- **Frontier**: the effort's issues that are open, unblocked and unclaimed;
  the lowest number wins.
- **Claim**: set `Status: ready-for-agent` and add `Claimed: <date>`, then
  save before any work.
- **Resolve**: append the answer under `## Answer`, set `Status: resolved`,
  then add a one-line pointer (gist and link) to the map's Decisions so far.
