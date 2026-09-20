# ADR-0002: ViViEfs purpose, scope and the evidence-collection exemplar

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: none (intent). The exemplar is proven by later gates, not this
record.

Related: D1, D6, D7, D23, D55.
[Vision and scope](../plan/bootstrap/01-vision-and-scope.md).

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

Only the **evidence-collection** exemplar lives here for now (D55). It exercises
every concept once: capture a photo (content-hash blob), upload with retry, wait
for reviewer approval (`DurableDeferred` completed on the web), remind after 24h
(`DurableClock` -> local notification), crash and resume, lease handoff, server
sync. Product apps later occupy `apps/<product>-mobile` + `apps/<product>-server`
without restructuring.

Decisions of the earlier session carry over (D6): local notification is the
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
(voice, affordance) stay out of P08 and of this ADR.

## Outcome

### Expected

One repo, one exemplar, a slot for later product app pairs, Apache-2.0.

### Observed

Not yet run. The repository exists; the exemplar app is a named slot until its
gates pass.
