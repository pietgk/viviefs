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

Each exercise section `NN` pairs with lesson `NN` of the guide (D81): the lesson
teaches the idea, the section is its tangible win.

## The test is the positive control

Each exercise has one `exercise.test.ts` that runs one check against both
folders through `exercise()` from `@viviefs/testing/exercise`. The solution
must pass. The problem must fail, with the assertion the exercise expects
(`failsWith`). A problem that already passes teaches nothing, so write the test
first and watch both verdicts before moving on. Learners run the check against
`problem/` alone with `pnpm exercise <pattern> <NN.MM>`.

The log-store track (`exercises/log-store/`) is the reference: shared setup in
`track.ts`, one folder per exercise, the track's `vitest.config.ts` from
`exerciseTrackConfig`.

## Steps

1. Read the pattern's guide (`concepts`, `how-to`, its lessons).
2. Create the folders for each planned exercise. A new track is an Nx project
   `exercises/<pattern>` (`kind:tool`, a `test` target) named in the guide's
   `exercises` frontmatter.
3. Write the test, then the solution until it passes, then cut the solution
   back to the problem stub until the test fails with the expected assertion.
4. Run `pnpm verify`. Its `guides` step checks the layout, the numbering and
   the pairing with lessons.

To renumber, `git mv` the folder so history follows it, then run `pnpm verify`.

## Not built yet

The `exercise` generator in `@viviefs/generators` comes with the durable
workflow track (D66). When it lands, replace step 2 with it.
