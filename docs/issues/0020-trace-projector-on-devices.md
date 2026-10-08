# I20: The trace projector on iOS, Android and web

Status: ready-for-human

Category: enhancement

Decide when: the evidence app or a consumer app runs the projector

## What

[P10 Trace projection][P10] ran the trace projector on the host only; [P03 OTLP and motel][P03] measured OTLP from Hermes, but no device has projected its own traces.

## Direction

Not in [P11 Identity][P11] ([P11][P11] grilling). Wire it with the first consumer app, and extend a device run to check it.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[P03]: ../plan/bootstrap/06-qualification-gates.md#p03
[P10]: ../plan/bootstrap/06-qualification-gates.md#p10
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
