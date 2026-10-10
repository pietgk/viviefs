# I72: verify baseline fails in a fresh worktree

Status: needs-triage

Category: bug

Found: 2026-10-09

## What

`pnpm verify baseline` crashes in a fresh git worktree when Nx restores the `evidence-mobile` build from its cache, because the bundle report file the baseline reads is missing. Reported by the agent that fixed [I27 The docs development server does not come up reliably, and has no search][I27] in a worktree under `.claude/worktrees/`; running `nx run evidence-mobile:bundle-size` once worked around it. Not reproduced yet.

Agents now work in worktrees (the `.gitignore` entry of 2026-10-09 keeps them out of Nx), so a baseline recorded there hits it. To do: reproduce in a fresh worktree with a warm Nx cache, then make the bundle report an output of the cached target, or have `verify baseline` produce it when it is missing.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[I27]: 0027-docs-dev-server-unreliable-and-without-search.md
