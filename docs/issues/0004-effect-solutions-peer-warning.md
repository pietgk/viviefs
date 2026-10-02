# I4: effect-solutions pins an older effect and warns on install

Status: ready-for-human

Category: bug

Found: 2026-10-01

## What

`effect-solutions` 0.5.3, the newest, pins `effect` 4.0.0-beta.59 and leaves an unmet peer warning on every install. It is a development-only CLI (`pnpm exec effect-solutions show <topic>`) and the cause is upstream; confirm that the warning is acceptable until a newer release.

## Comments
