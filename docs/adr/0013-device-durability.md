# ADR-0013: Device durability

Status: Proposed, unverified

Date: 2026-09-20

Qualifying gate: P07, P14

Related: D3, D24, D25. [ADR 0012](0012-datom-backed-workflow-engine.md).

## Problem

iOS does not guarantee code on a schedule while the app is closed. Several
browser tabs on one OPFS database would be several engines. "Resume on next
launch" needs a mechanism, not a slogan.

## Design

On device, durable means **resume on next launch**. OS timers and notification
intents are the triggers.

Long `DurableClock` sleeps write a `wake_at` datom and schedule a local
notification (expo-notifications; Android `alarmClock` delivery for
time-critical). The engine sweeps due clocks on launch and foreground;
expo-background-task sweeps opportunistically. Notification actions complete
the matching `DurableDeferred`. Push from the server is only a wake-up hint.

Browser: one leader tab per profile runs the engine (Web Locks); other tabs
render and forward events via BroadcastChannel. Each browser profile counts as
one device for leases.

## Trade-offs

Local notifications are the only iOS-reliable timer. Background tasks are
opportunistic and must not be treated as a schedule. Web Locks add a leader
election the native apps do not need.

## Failure-handling

P07: Maestro via agent-device force-quits mid-upload and mid-wait on iOS
simulator **and** Android emulator; relaunch resumes; a scheduled local
notification tap completes a deferred; the trace shows crash and resume.
Positive control: without the engine sweep on launch, the workflow does not
resume. P07 fails if the Android emulator fails.

P14: two tabs, one engine; killing the leader promotes the other, which
resumes; followers render and forward. Positive control: without the lock, two
engines are detected. P14 is follow-on, not foundation closure.

## Outcome

### Expected

Force-quit mid-workflow resumes on next launch. Notifications complete
deferreds. One engine per browser profile.

### Observed

Not yet run.
