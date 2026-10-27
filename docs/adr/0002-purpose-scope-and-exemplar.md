# ADR-0002: ViViEfs purpose, scope and the evidence-collection exemplar

Summary: ViViEfs is its own repository: a reference stack for an Expo app and its backend, proven on one evidence-collection exemplar.

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: none (intent). The exemplar is proven by later gates, not this
record.

Related: [D1 A reference stack][D1], [D6 Earlier decisions carry over][D6], [D7 Its own repository][D7], [D23 Evidence-collection exemplar][D23], [D55 Exemplar first, product apps later][D55], [D55' Consumer apps live here][D55'], [D95 App creation][D95],
[D100 Out of scope means not yet][D100], [D101 Lab and production][D101], [D106 Consumer app shape][D106], [D158 The out-of-scope list, item by item][D158], [D159 Product choices stay with the consumer app][D159]. [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] (what ViViEfs is
about). [Vision and scope](../plan/bootstrap/01-vision-and-scope.md).

## Problem

A reference stack that lives inside a product repo inherits that product's
choices. BirVana, an ERP frontend, and a GRC frontend all want the same patterns
(Effect, durable execution, one datom log, component-based UI) without sharing
one product's XState or voice ADRs.

## Design

ViViEfs is its own repository (`pietgk/viviefs`, Apache-2.0). It is a reference
stack for a modern Expo app and its backend, designed to be AI-robust: typesafe
end to end, composed from explicit patterns, documented so humans and LLMs learn
the same way.

Only the **evidence-collection** exemplar lives here for now ([D55 Exemplar first, product apps later][D55]). It exercises
every concept once: capture a photo (content-hash blob), upload with retry, wait
for reviewer approval (`DurableDeferred` completed on the web), remind after 24h
(`DurableClock` -> local notification), crash and resume, lease handoff, server
sync. Product apps later occupy `apps/<product>-mobile` + `apps/<product>-server`
without restructuring.

**What ViViEfs is about, the consumer apps and the out-of-scope list** (amendment
2026-10-27, [D95 App creation][D95], [D55' Consumer apps live here][D55'], [D106 Consumer app shape][D106], [D158 The out-of-scope list, item by item][D158], [D159 Product choices stay with the consumer app][D159], [I59 Bring ADR-0002 and the vision page in line with I47][I59]). What
ViViEfs is about, app creation, is [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]'s; this record keeps what ViViEfs builds. The
consumer apps live in this repository too, built on the stack and improving it by
using it; the first arrives once the exemplar is more mature. Each is
`apps/<product>-client` + `apps/<product>-server`, so "only the exemplar lives
here for now" and the `-mobile` pair above no longer hold. Each consumer app makes
its own product-specific choices; the stack's ADRs take none. The one
out-of-scope list is [the vision page's](../plan/bootstrap/01-vision-and-scope.md#out-of-scope-for-now), where each item
says what must stay possible and whether it is learnable in the lab ([D100 Out of scope means not yet][D100],
[D101 Lab and production][D101]); the list below is the one this record started with.

Decisions of the earlier session carry over ([D6 Earlier decisions carry over][D6]): local notification is the
guaranteed timer, old workflow versions ship side by side, a central sync server
exists.

Out of scope for now: guaranteed work while the app is closed, multi-writer
merge of executions, production hosting, engine scale-out, product-specific
choices of consumer apps.

## Trade-offs

A new repo duplicates some complyj/web-interview/vivief material instead of
importing it. That is the point: the reference needs its own ADRs and one
exemplar that proves every pattern. Putting product apps in later as pairs
avoids coupling the reference to BirVana's remaining choices.

## Failure-handling

If the exemplar cannot exercise a named concept, that concept is not delivered.
Do not add a second exemplar to paper over a gap. Product-specific criteria
(voice, affordance) stay out of [P08 UI three-way prototype][P08] and of this ADR.

## Outcome

### Expected

One repo, one exemplar, a slot for later product app pairs (`<product>-client` +
`<product>-server`, as amended above), Apache-2.0.

### Observed

Not yet run. The repository exists; the exemplar app is a named slot until its
gates pass.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0032]: 0032-what-viviefs-is-about.md
[D1]: ../plan/bootstrap/02-decision-log.md#d1
[D100]: ../plan/bootstrap/02-decision-log.md#d100
[D101]: ../plan/bootstrap/02-decision-log.md#d101
[D106]: ../plan/bootstrap/02-decision-log.md#d106
[D158]: ../plan/bootstrap/02-decision-log.md#d158
[D159]: ../plan/bootstrap/02-decision-log.md#d159
[D23]: ../plan/bootstrap/02-decision-log.md#d23
[D55]: ../plan/bootstrap/02-decision-log.md#d55
[D55']: ../plan/bootstrap/02-decision-log.md#d55p
[D6]: ../plan/bootstrap/02-decision-log.md#d6
[D7]: ../plan/bootstrap/02-decision-log.md#d7
[D95]: ../plan/bootstrap/02-decision-log.md#d95
[I59]: ../issues/0059-bring-adr-0002-and-the-vision-in-line-with-i47.md
[P08]: ../plan/bootstrap/06-qualification-gates.md#p08
