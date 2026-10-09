# I57: Out-of-scope items in an ADR's trade-offs

Status: resolved

Category: enhancement

Found: 2026-10-07

## What

The ADR template's Trade-offs section does not ask which out-of-scope items a decision makes harder, so [D100 Out of scope means not yet][D100] ("out of scope means not yet") has no place where each decision answers to it. Add a line to [the ADR template](../adr/template.md) Trade-offs: name the out-of-scope items (01-vision-and-scope "Out of scope (for now)") this decision makes harder, and how much; "none" is an answer. The concept tickets of map 2 (I48-[I56 One shape at every level?][I56]) are the first to use it.

From [I47](0047-what-viviefs-is-about.md) ([D100 Out of scope means not yet][D100], [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032]).

## Answer

Resolved on 2026-10-09: the ADR template's Trade-offs section ends with an **Out-of-scope items** bullet naming the items under "Out of scope (for now)" a decision makes harder, how much, and what [D105 What must stay possible][D105] lists as needing to stay possible; "none" is an answer. [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] to [ADR-0035 Accepting a change][ADR-0035] already carry it, so the template now asks what they do.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[ADR-0035]: ../adr/0035-accepting-a-change.md
[D100]: ../plan/bootstrap/02-decision-log.md#d100
[D105]: ../plan/bootstrap/02-decision-log.md#d105
[I56]: 0056-one-shape-at-every-level.md
