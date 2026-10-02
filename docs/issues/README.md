# Issues

Open issues of ViViEfs, one file each (D92). This is the tracker the
`triage`, `to-tickets` and `wayfinder` skills work against
([issue tracker](../agents/issue-tracker.md)); GitHub Issues are not used.
The docs site lists them under Reference > Issues with their status, and an
issue id like `I1` anywhere in the docs renders as a named link.

## Conventions

- One file per issue, `NNNN-short-title.md`, numbered from 0001 like ADRs and
  never reused or renumbered. The id is `I` and the number without zeros:
  `0001-...` is `I1`. Start from the [template](template.md).
- The title line is `# I<n>: <title>`. Under it:
  - `Status:` one of `needs-triage`, `needs-info`, `ready-for-agent`,
    `ready-for-human`, `wontfix` (the triage roles,
    [triage labels](../agents/triage-labels.md)) or `resolved`.
  - `Category:` `bug` or `enhancement`.
  - Optional: `Effort:` (the `docs/plan/<effort>/` it belongs to),
    `Blocked by:` (issue ids), `Decide when:` (the trigger for a deferred
    decision), `Found:` (date).
- `## What` comes first; its first sentence is the preview shown when a
  reference to the issue is hovered, so it says the issue in one line.
- A resolved issue keeps its file, with `Status: resolved` and a closing
  comment naming what resolved it (a commit, a decision, a gate run).
- Conversation appends under `## Comments`.

In conversation, "#42" means `I42`; in the docs, write `I42`, because a bare `#N`
already names issues of other projects on GitHub.
