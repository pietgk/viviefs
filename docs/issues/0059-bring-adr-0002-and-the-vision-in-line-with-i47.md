# I59: Bring ADR-0002 and the vision page in line with I47

Status: resolved

Category: enhancement

Found: 2026-10-07

## What

[ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] and [01-vision-and-scope](../plan/bootstrap/01-vision-and-scope.md) still say what ViViEfs was before [I47 What ViViEfs is about][I47]: only the exemplar lives here, product apps later as pairs ([D55 Exemplar first, product apps later][D55]), and an Out of scope list that reads as final. Bring them in line with [I47](0047-what-viviefs-is-about.md)'s decisions, as an amendment note on [ADR-0002][ADR-0002] and edits to the vision page:

- Link [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] for what ViViEfs is about; [ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002] keeps what it builds ([D95 App creation][D95]).
- The consumer apps live in this repository ([D55' Consumer apps live here][D55']); their shape, pairs or otherwise, follows [I48 The server-independent goal, and what an app is to a device and a node][I48].
- Each Out of scope item says what must stay possible ([D100 Out of scope means not yet][D100]) and whether it is production only, and so learnable in the lab, or not yet at all ([D101 Lab and production][D101]). The human decides per item; [I58 Several servers in the lab][I58] and [I8 Engine scale-out and a multi-runner server][I8] are the two [I47 What ViViEfs is about][I47] named as learnable in the lab.
- The vision page's "Expo app together with its backend" wording names no topology beyond today's apps, as the glossary's ViViEfs entry now does.

## Answer

Decided with the human on 2026-10-27 on [the review page](../research/2026-10-27-adr-0002-and-vision-review.html) ([D158 The out-of-scope list, item by item][D158], [D159 Product choices stay with the consumer app][D159]). The page found six places out of date (only the exemplar here, the `-mobile` pair, no link to what ViViEfs is about, "an Expo app together with its backend", a central sync server with no word for authority, a lease handoff) and took the out-of-scope list item by item.

- **The out-of-scope list** ([D158 The out-of-scope list, item by item][D158]) is 01-vision's alone, six items, each saying what must stay possible and lab or not yet. Not yet at all: guaranteed work while the app is closed, and two writers on one workflow execution merged afterwards (one item for the two that said it twice, "rejected" gone). Production only, and so learnable in the lab: production hosting ([I7 Production hosting, deployment and telemetry backend][I7], whose `Decide when:` gains the lab trigger), several servers ([I58 Several servers in the lab][I58], added: [D101 Lab and production][D101] named it but the list lacked it), engine scale-out as [D39' One engine, one journal, one fence][D39'] has it ([I8 Engine scale-out and a multi-runner server][I8]), and the server-independent mode, unchanged. Features map 2 deferred with a `Decide when:` stay in their issues.
- **Product-specific choices** ([D159 Product choices stay with the consumer app][D159]) are no longer an out-of-scope item but an In scope rule: each consumer app makes its own, the stack's ADRs and guides take none. Where a consumer app keeps its own ADRs is decided with the first one.
- **[ADR-0002 ViViEfs purpose, scope and the evidence-collection exemplar][ADR-0002]** carries one amendment paragraph: what ViViEfs is about is [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]'s, the consumer apps live here as `<product>-client` + `<product>-server`, and the one out-of-scope list is the vision page's. Its original text stays as history.
- **[01-vision-and-scope](../plan/bootstrap/01-vision-and-scope.md)** is edited in place: today's apps named as the glossary's ViViEfs entry names them, the consumer apps, the handoff, sync with the `node` that holds authority, the In scope rule and the new list.

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
[D158]: ../plan/bootstrap/02-decision-log.md#d158
[D159]: ../plan/bootstrap/02-decision-log.md#d159
[D39']: ../plan/bootstrap/02-decision-log.md#d39p
[D55]: ../plan/bootstrap/02-decision-log.md#d55
[D55']: ../plan/bootstrap/02-decision-log.md#d55p
[D95]: ../plan/bootstrap/02-decision-log.md#d95
[I47]: 0047-what-viviefs-is-about.md
[I48]: 0048-where-the-server-independent-goal-is-recorded.md
[I58]: 0058-several-servers-in-the-lab.md
[I7]: 0007-production-hosting-and-telemetry-backend.md
[I8]: 0008-engine-scale-out.md
