# I76: P07 leaves agent-device replay daemons running

Status: needs-triage

Category: bug

Found: 2026-10-23

## What

Every [P07 Device resume E2E][P07] run leaves one agent-device daemon running per Maestro replay (six per run), each in its own temporary state directory, and nothing stops them. On the Mac 25 had piled up from gate runs on 2026-09-28, 2026-09-29, 2026-10-01, 2026-10-02 and 2026-10-22; they were stopped by hand on 2026-10-23. Two came from agent-device 0.21.30, the current pin.

[P07 Device resume E2E][P07] drives each flow with `agent-device replay <flow> --maestro`, between an `open` and a `close` (`replayMaestro` in `tools/qualification/src/probes/p07.ts`). With no `--state-dir`, a `replay` starts a private daemon in `$TMPDIR/agent-device-replay-daemon-XXXX`. agent-device 0.21.30 retires that daemon after the replay (`cleanupDaemonAfterRequest` in callstack/agent-device's `src/daemon-client/daemon-client-lifecycle.ts`), unless the script left its session active: then it keeps the daemon on purpose, so the caller can close the session ("caller owns close", in agent-device's [active-session decision](https://github.com/callstack/agent-device/blob/v0.21.30/docs/adr/0016-active-session-script-publication.md)). No [P07][P07] flow ends in a close, so every replay keeps its daemon. [P07][P07]'s `close` names no state directory and reaches the default daemon, not this one. The kept daemon's session holds no idle timer (`AGENT_DEVICE_SESSION_IDLE_TIMEOUT_MS` is off by default), so the daemon never idle-exits. It also holds a device claim on the simulator or emulator, which its `daemon stop` releases.

Reproduced on the Mac on 2026-10-24 with a one-step flow (`appId: com.apple.Preferences`, `- launchApp`): before, no daemon; after `replay --maestro --platform ios`, one daemon in `agent-device-replay-daemon-1u4DYf`, and the replay's reply said "This session's daemon was kept alive because its script left the session active; pass --state-dir ... --session ... on your next command to reach it." A plain `close` after it left that daemon running.

This is agent-device's documented behaviour, not a bug in it, so the fix is ours: run each replay on a state directory of our own, then `agent-device daemon stop --state-dir` it.

## Comments

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[P07]: ../plan/bootstrap/06-qualification-gates.md#p07
