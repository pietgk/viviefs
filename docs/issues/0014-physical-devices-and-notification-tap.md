# I14: Physical devices, and a notification tap that completes a durable deferred

Status: ready-for-human

Category: bug

Decide when: before the first consumer app

## What

Every device run so far used simulators and emulators, and [P07 Device resume E2E][P07]'s visible local-notification tap still misses on both platforms: the durable deferred completes through the relaunch fallback ([ADR-0013 Device durability][ADR-0013]).

## Direction

One run on a physical iOS device and a physical Android device, covering both.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0013]: ../adr/0013-device-durability.md
[P07]: ../plan/bootstrap/06-qualification-gates.md#p07
