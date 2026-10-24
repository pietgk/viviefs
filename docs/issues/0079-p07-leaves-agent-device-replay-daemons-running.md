# I79: P07 leaves agent-device replay daemons running

Status: resolved

Category: bug

Found: 2026-10-23

## What

Every [P07 Device resume E2E][P07] run leaves agent-device daemons running, one for each Maestro replay that succeeds (two per run, both on Android), each in its own temporary state directory, and nothing stops them. On the Mac 25 had piled up from gate runs on 2026-09-28, 2026-09-29, 2026-10-01, 2026-10-02 and 2026-10-22; they were stopped by hand on 2026-10-23. Two came from agent-device 0.21.30, the current pin.

[P07 Device resume E2E][P07] drives each flow with `agent-device replay <flow> --maestro`, between an `open` and a `close` (`replayMaestro` in `tools/qualification/src/probes/p07.ts`). With no `--state-dir`, a `replay` starts a private daemon in `$TMPDIR/agent-device-replay-daemon-XXXX`. agent-device 0.21.30 retires that daemon after the replay (`cleanupDaemonAfterRequest` in callstack/agent-device's `src/daemon-client/daemon-client-lifecycle.ts`), unless the script left its session active: then it keeps the daemon on purpose, so the caller can close the session ("caller owns close", in agent-device's [active-session decision](https://github.com/callstack/agent-device/blob/v0.21.30/docs/adr/0016-active-session-script-publication.md)). No [P07][P07] flow ends in a close, so every replay that succeeds keeps its daemon; one that fails retires it. [P07][P07]'s `close` names no state directory and reaches the default daemon, not this one. The kept daemon's session holds no idle timer (`AGENT_DEVICE_SESSION_IDLE_TIMEOUT_MS` is off by default), so the daemon never idle-exits. It also holds a device claim on the simulator or emulator, which its `daemon stop` releases.

Reproduced on the Mac on 2026-10-24 with a one-step flow (`appId: com.apple.Preferences`, `- launchApp`): before, no daemon; after `replay --maestro --platform ios`, one daemon in `agent-device-replay-daemon-1u4DYf`, and the replay's reply said "This session's daemon was kept alive because its script left the session active; pass --state-dir ... --session ... on your next command to reach it." A plain `close` after it left that daemon running.

The same split hides a second fault: because `open` ran on the default daemon, the replay's daemon had no app session, and on iOS every flow failed at its first step ("iOS snapshot requires an active app session on the target device. Run open first", in the run of 2026-10-22 and in the first run of 2026-10-24). Android's snapshots need no session, so its flows ran. So on iOS [P07 Device resume E2E][P07] has never driven the force-quit with Maestro; it passed through the force-quit fallback in `p07.ts`.

This is agent-device's documented behaviour, not a bug in it, so the fix is ours: `open`, `replay` and `close` run on one state directory of our own, then `agent-device daemon stop --state-dir` stops that daemon.

## Comments

2026-10-24: Resolved by `withOwnAgentDeviceDaemon` in `tools/qualification/src/probes/agent-cli.ts` (commits `4e24b01` and `327d485`, whose messages still use its first number, 76): `replayMaestro` runs `open`, `replay` and `close` on a state directory of its own and stops the daemon there with `daemon stop --state-dir`; a stop it cannot confirm fails the probe. [P01 Platform on SDK 58][P01]-[P11 Identity][P11] passed in one sequential run on `946846318` (run `2026-10-24T10-41-01.028Z-5e8b8c21`, clean tree), after the move to [I79 P07 leaves agent-device replay daemons running][I79], which is the number the human's local main had not taken yet (`9468463`); the run before it, on `1b959a7e0`, passed the same way. On the Mac, agent-device daemons were 0 before the run and 1 after it, the default daemon in `~/.agent-device`; a sample every 20 s showed each of [P07 Device resume E2E][P07]'s six own daemons alive only during its replay, and no state directory was left. iOS mid-upload and no-sweep now replay all 6 Maestro steps; both mid-wait notification taps still miss, as before, and the fallback completes the deferred.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[I79]: 0079-p07-leaves-agent-device-replay-daemons-running.md
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P07]: ../plan/bootstrap/06-qualification-gates.md#p07
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
