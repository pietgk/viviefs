# I59: Bring ADR-0002 and the vision page in line with I47

Status: ready-for-human

Category: enhancement

Found: 2026-10-07

## What

[ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] and [01-vision-and-scope](../plan/bootstrap/01-vision-and-scope.md) still say what ViViEfs was before [I47 What ViViEfs is about][I47]: only the exemplar lives here, product apps later as pairs ([D55 Exemplar first, product apps later][D55]), and an Out of scope list that reads as final. Bring them in line with [I47](0047-what-viviefs-is-about.md)'s decisions, as an amendment note on [ADR-0002][ADR-0002] and edits to the vision page:

- Link [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] for what ViViEfs is about; [ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] keeps what it builds ([D95 App creation][D95]).
- The consumer apps live in this repository ([D55' Consumer apps live here][D55']); their shape, pairs or otherwise, follows [I48 The server-independent goal, and what an app is to a device and a node][I48].
- Each Out of scope item says what must stay possible ([D100 Out of scope means not yet][D100]) and whether it is production only, and so learnable in the lab, or not yet at all ([D101 Lab and production][D101]). The human decides per item; [I58 Several servers in the lab][I58] and [I8 Engine scale-out and a multi-runner server][I8] are the two [I47 What ViViEfs is about][I47] named as learnable in the lab.
- The vision page's "Expo app together with its backend" wording names no topology beyond today's apps, as the glossary's ViViEfs entry now does.

## Comments

- 2026-10-07: [I48](0048-where-the-server-independent-goal-is-recorded.md) settled the pair shape ([D106 Consumer app shape][D106]): [ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] (Design, "Product apps later occupy `apps/<product>-mobile` + `apps/<product>-server`") and 01-vision ("`apps/<product>-mobile` + `apps/<product>-server` slot later") become `<product>-client` + `<product>-server`. [I48 The server-independent goal, and what an app is to a device and a node][I48] already added the server-independent mode's Out of scope line in [D100 Out of scope means not yet][D100]'s form ([D104 The server-independent goal][D104], [D105 What must stay possible][D105]), the first such item.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0002]: ../adr/0002-purpose-scope-and-exemplar.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[D100]: ../plan/bootstrap/02-decision-log.md#d100
[D101]: ../plan/bootstrap/02-decision-log.md#d101
[D104]: ../plan/bootstrap/02-decision-log.md#d104
[D105]: ../plan/bootstrap/02-decision-log.md#d105
[D106]: ../plan/bootstrap/02-decision-log.md#d106
[D55]: ../plan/bootstrap/02-decision-log.md#d55
[D55']: ../plan/bootstrap/02-decision-log.md#d55p
[D95]: ../plan/bootstrap/02-decision-log.md#d95
[I47]: 0047-what-viviefs-is-about.md
[I48]: 0048-where-the-server-independent-goal-is-recorded.md
[I58]: 0058-several-servers-in-the-lab.md
[I8]: 0008-engine-scale-out.md
