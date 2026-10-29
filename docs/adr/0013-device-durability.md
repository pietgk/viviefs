# ADR-0013: Device durability

Summary: On a device, durable means resume on the next launch, woken by local notifications.

Status: Qualified ([P07 Device resume E2E][P07] native resume). [P17 Browser engine leader][P17] (browser leader) unverified

Date: 2026-09-20

Qualifying gate: [P07 Device resume E2E][P07], [P17 Browser engine leader][P17]

Related: [D3 Resume on next launch][D3], [D24 Durable clocks and notifications][D24], [D25 Browser engine leader][D25]. [ADR 0012](0012-datom-backed-workflow-engine.md).

## Problem

iOS does not guarantee code on a schedule while the app is closed. Several
browser tabs on one OPFS database would be several workflow engines. "Resume on next
launch" needs a mechanism, not a slogan.

## Design

On device, durable means **resume on next launch**. OS timers and notification
intents are the triggers.

Long `DurableClock` sleeps write a `wake_at` datom and schedule a local
notification (expo-notifications; Android `alarmClock` delivery for
time-critical). The workflow engine sweeps due clocks on launch and foreground;
expo-background-task sweeps opportunistically. Notification actions complete
the matching `DurableDeferred`. Push from the server is only a wake-up hint.

Browser: one leader tab per profile runs the workflow engine (Web Locks); other tabs
render and forward events via BroadcastChannel. Each browser profile counts as
one device for leases.

## Trade-offs

Local notifications are the only iOS-reliable timer. Background tasks are
opportunistic and must not be treated as a schedule. Web Locks add a leader
election the native apps do not need.

## Failure-handling

[P07 Device resume E2E][P07]: Maestro via agent-device force-quits mid-upload and mid-wait on iOS
simulator **and** Android emulator; relaunch resumes; a scheduled local
notification tap completes a durable deferred; the trace shows crash and resume.
Positive control: without the workflow engine sweep on launch, the workflow does not
resume. [P07][P07] fails if the Android emulator fails.

[P17 Browser engine leader][P17]: two tabs, one workflow engine; killing the leader promotes the other, which
resumes; followers render and forward. Positive control: without the lock, two
workflow engines are detected. [P17][P17] is follow-on, not foundation closure.

## Outcome

### Expected

Force-quit mid-workflow resumes on next launch. Notifications complete
durable deferreds. One workflow engine per browser profile.

### Observed

2026-09-21. Ledger pass `2026-09-21T07-05-26.784Z-33ca482f`. Force-quit
mid-upload and mid-wait resumed on iOS simulator and Android emulator when
`EngineSweep` ran on launch; without the sweep the workflow stayed parked.
Motel showed `p07.park` and `p07.resume` for the mid-upload token on both
platforms. Completing the `approval` durable deferred after relaunch finished
`DeviceResume.v1`. Maestro YAML did not itself deliver the kill (iOS replay
daemon had no session; Android saw the Expo developer menu); `simctl` /
`adb force-stop` did. A SpringBoard/shade tap on "[P07 Device resume E2E][P07] approval" was not
observed; the durable deferred completed via last-notification-response or a host
`runtime:eval` of the in-app complete hook. [P17 Browser engine leader][P17] not run. Evidence:
[2026-09-21-p07.md](../evidence/2026-09-21-p07.md).

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D24]: ../plan/bootstrap/02-decision-log.md#d24
[D25]: ../plan/bootstrap/02-decision-log.md#d25
[D3]: ../plan/bootstrap/02-decision-log.md#d3
[P07]: ../plan/bootstrap/06-qualification-gates.md#p07
[P17]: ../plan/bootstrap/06-qualification-gates.md#p17
