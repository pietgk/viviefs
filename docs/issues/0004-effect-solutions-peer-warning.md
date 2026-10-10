# I4: effect-solutions pins an older effect and warns on install

Status: resolved

Category: bug

Found: 2026-10-01

Decide when: a release of effect-solutions peers effect ^4

## What

`effect-solutions` 0.5.3, the newest, pins `effect` 4.0.0-beta.59 and leaves an unmet peer warning on every install. It is a development-only CLI (`pnpm exec effect-solutions show <topic>`) and the cause is upstream; confirm that the warning is acceptable until a newer release.

## Comments

2026-10-02: Unchanged after Effect 4.0.0: `effect-solutions` 0.5.3 is still the
newest and still pins `effect` 4.0.0-beta.59. A second peer warning,
`@typeonce/effect-machine` requiring the release candidate, is [I23 effect-machine still requires the Effect release candidate][I23].

2026-10-09: Rechecked after Effect moved to 4.0.2 (the human asked to upgrade first): `effect-solutions` 0.5.3 is still the newest and still depends on `effect` 4.0.0-beta.59 and `@effect/platform-bun` 4.0.0-beta.59, so the warning is unchanged by our pin. Proposed with the human (phase 0): accept it, `Decide when:` a release peers `effect` ^4.

2026-10-10: The human accepted the warning. Resolved as a deferred issue: the warning stays until a release of `effect-solutions` peers `effect` ^4, the `Decide when:` trigger that reopens this issue to move to that release.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[I23]: 0023-effect-machine-on-stable-effect.md
