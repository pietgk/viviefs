# I76: Verify's verdict is not kept per commit

Status: ready-for-human

Category: enhancement

Decide when: a gate must know it ran on a verified commit

Found: 2026-10-23

## What

Whether `pnpm verify` passed on a commit is kept only in the CI run, not in the repository, so a gate or a reader cannot tell from the repository whether a commit is a verified commit ([D133 Verified commit][D133]). Found in [I56](0056-one-shape-at-every-level.md), drawing the code level's frontier ([the review page](../research/2026-10-10-one-shape-review.html), section 3b).

At the data level the frontier's verdict is kept: a changeset is in the log, or there is a typed rejection ([D124 One checkpoint][D124]). At the code level it is not. CI (`.github/workflows/ci.yml`) runs verify on every push to `main` and prints `GREEN · n checks` or `RED`, but the result stays in GitHub Actions. `pnpm qualify` runs on a committed tree, and each ledger entry records `commit` and `dirty`, not whether verify passed on that commit.

Nothing needs it yet. It matters when a gate's evidence must say it ran on a verified commit, or when a reader of the ledger must tell a qualified commit that was also verified from one that was not.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D124]: ../plan/bootstrap/02-decision-log.md#d124
[D133]: ../plan/bootstrap/02-decision-log.md#d133
