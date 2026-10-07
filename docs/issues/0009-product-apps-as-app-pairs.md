# I9: Product apps in this repository as app pairs

Status: resolved

Category: enhancement

Decide when: before the first consumer app

## What

Whether BirVana, ERP and GRC live in this repository as `<product>-mobile` and `<product>-server` pairs (D55) is open.

## Direction

Decide after P11-P17.

## Answer

Decided in [I47](0047-what-viviefs-is-about.md) on 2026-10-07 (D55'): the consumer apps live in this repository, built on the stack and improving it by using it (D95). When the first one arrives stays open, once the exemplar is more mature. Their shape, a `<product>-mobile` + `<product>-server` pair or otherwise, is not settled here: a pair assumes an app is tied to a device, and I48 asks what an app is to a device and a node.

## Comments

- 2026-10-06, the human (on [the vivief inventory](../plan/vivief-inventory/map.md), after I39): the candidate consumer apps are BirVana (learning a language while taking a walk), ERP, GRC, the counseling platform, procurement and probably retail. They will probably live in this repository once the exemplar is more mature. The apps are part of the proof that a pattern is useful and has a place in this repository.
- 2026-10-06, the human, on retail: the start is [Heads](https://heads.com) and its Heads Commerce offering. An earlier app built on the Heads API is lost; that the API is available, and that an app was built on it once, is the starting point for understanding the domain and for modelling the retail space Heads serves. Heads now does what ViViEfs is moving towards: its headline reads "Imagine if your *entire* enterprise fit in here", "One intelligence to build, run and scale your enterprise" (heads.com, read 2026-10-06).
- 2026-10-07: the shape is settled in [I48](0048-where-the-server-independent-goal-is-recorded.md) (D106): a consumer app is `<product>-client` (phone and web) + `<product>-server`; `evidence-mobile` is renamed in I61.
