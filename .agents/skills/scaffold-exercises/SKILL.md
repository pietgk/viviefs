---
name: scaffold-exercises
description: Create or renumber a pattern's exercise track under exercises/<pattern>/, with a problem/ and a solution/ folder per exercise. Use when the user wants to scaffold exercises, add an exercise to a guide, or renumber a track.
---

# Scaffold Exercises

Repo-owned fork of `mattpocock/skills` `scaffold-exercises` (MIT), adapted to
D66 in [the decision log](../../../docs/plan/bootstrap/02-decision-log.md). An
**exercise** is a stub, a failing test and a reference solution that passes in
`verify` (`GLOSSARY.md`). The concept it practises lives in the guide's
`concepts` page, never in the exercise.

## Layout

```
exercises/<pattern>/
└── NN.MM-name/
    ├── problem/    # the stub the learner completes
    └── solution/   # the reference solution
```

- `<pattern>` is the guide's folder name (`guides/<pattern>/`).
- `NN` is the section, `MM` the exercise within it; names are dash-case.
- One Nx project per track, tagged `kind:tool` (D57).
- No `explainer/` folder, no `.gitkeep`, no `readme.md` that restates the guide.

## The test is the positive control

Each exercise has one test that runs against both folders. The solution must
pass. The problem must fail, with the assertion the exercise expects. A problem
that already passes teaches nothing, so write the test first and watch both
verdicts before moving on.

## Steps

1. Read the pattern's guide (`concepts`, `how-to`) and its exercise list.
2. Create the folders for each planned exercise.
3. Write the test, then the solution until it passes, then cut the solution
   back to the problem stub until the test fails with the expected assertion.
4. Run `pnpm verify`.

To renumber, `git mv` the folder so history follows it, then run `pnpm verify`.

## Not built yet

The layout check in `verify` comes with the log-store track, and the `exercise`
generator in `@viviefs/generators` with the durable workflow track (D66). When
either lands, replace the matching step above with it.
