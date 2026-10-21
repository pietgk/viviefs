# I72: verify baseline fails in a fresh worktree

Status: resolved

Category: bug

Found: 2026-10-09

## What

`pnpm verify baseline` crashes in a fresh git worktree when Nx restores the `evidence-mobile` build from its cache, because the bundle report file the baseline reads is missing. Reported by the agent that fixed [I27 The docs development server does not come up reliably, and has no search][I27] in a worktree under `.claude/worktrees/`; running `nx run evidence-mobile:bundle-size` once worked around it. Not reproduced yet.

Agents now work in worktrees (the `.gitignore` entry of 2026-10-09 keeps them out of Nx), so a baseline recorded there hits it. To do: reproduce in a fresh worktree with a warm Nx cache, then make the bundle report an output of the cached target, or have `verify baseline` produce it when it is missing.

## Comments

2026-10-10: Triaged with the human: fix it in phase 3's qualification batch ([the handover](../plan/next-session.md)).

2026-10-21: Reproduced in a fresh clone on macOS. The cause is the scope, not
the cache: outside CI the build steps run `nx affected`, so a change that does
not touch `evidence-mobile` never runs its `bundle-size`, and the baseline then
reads a report nobody wrote. Resolved by running the baseline's `build` and
`bundle-size` over every project (`everyProject` in `tools/verify/src/stages.ts`).
The same fresh clone also failed the unit stage first, because the [ADR-0024 Repository structure][ADR-0024]
guardrail tests need Nx's project graph, which nothing had built yet; those
tests now build it themselves.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0024]: ../adr/0024-repository-structure.md
[I27]: 0027-docs-dev-server-unreliable-and-without-search.md
