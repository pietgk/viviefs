# I14: Physical devices, and a notification tap that completes a durable deferred

Status: ready-for-human

Category: bug

Decide when: before the first consumer app

## What

Every device run so far used simulators and emulators, and [P07 Device resume E2E][P07]'s visible local-notification tap still misses on both platforms: the durable deferred completes through the relaunch fallback ([ADR-0013 Device durability][ADR-0013]).

## Direction

One run on a physical iOS device and a physical Android device, covering both.

## Comments

2026-11-10: From [I100 Address the repo-wide review findings][I100]'s triage, finding R04 of the [2026-10-29 repo-wide review](../research/2026-10-29-repo-wide-review.md#r04-notification-qualification-can-bypass-the-tap) lands here, since this issue already owns the tap. What it adds: [P07 Device resume E2E][P07]'s probe (`tools/qualification/src/probes/p07.ts`) relaunches the app and calls a completion hook when the tap misses, then logs and summarizes "notification completed a deferred" and records a pass, on both platforms in the run of 2026-10-29. So the gate's verdict says more than the run observed. Required with this issue: keep the fallback as a diagnostic with its own label, and withhold the notification part of [P07][P07]'s claim until a real tap completes the durable deferred and the completion is read from the notification's response. The force-quit resume and the no-sweep control did run and stay as they are. Do not rename the gate or weaken its requirement. Rechecked on main on 2026-11-10: the probe is unchanged.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0013]: ../adr/0013-device-durability.md
[I100]: 0100-address-the-repo-wide-review-findings.md
[P07]: ../plan/bootstrap/06-qualification-gates.md#p07
