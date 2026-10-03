# I29: Ideas batch: agents that record a replayable run

Status: needs-triage

Category: enhancement

Found: 2026-10-03

Series: ideas-batch, third batch: `ideas-batch-agents-that-record-a-replayable-run`

## What

The e2e testing framework by TesterArmy lets an agent run a test step from a goal in plain words, records the actions it took once a check confirms the result, and replays them on the next run with no model call until the app changes. This issue keeps that as an idea for how ViViEfs organizes and runs its end-to-end tests on web and mobile, and as a more general idea: an agent does the open-ended work once and leaves a deterministic, durable version behind that runs without it. It overlaps with other ideas here (the durable workflow's journal, vivief's deterministic-first path, I24 and I25), so it goes to the same brainstorm. This issue does not decide anything.

## Source

[e2e](https://github.com/tester-army/e2e) ([site](https://tester.army/e2e), [docs](https://github.com/tester-army/e2e/tree/main/docs)), read on 2026-10-03.

| Fact | Detail |
| --- | --- |
| License and state | Apache-2.0. Created 2026-07-22, about 2,100 stars, release `e2e@0.16.0` on 2026-10-02. "In active development on the way to 1.0. APIs and config can still change between minor releases." |
| Platforms | Web through Playwright (Chromium, Firefox, WebKit) in `@e2e-dev/web`; iOS simulators, Android emulators and connected phones through [agent-device](https://github.com/callstack/agent-device) in `@e2e-dev/mobile`. Other platforms (desktop, TV) through a public driver contract (`defineEngine` in `e2e/engine`). API-only tests run in the same runner with `fetch` and no model. |
| Test format | TypeScript test files that mix agent steps (`agent.act`, `agent.assert`, `agent.waitFor`, `agent.extract`) with ordinary locators and `expect`. "One goal per call. The flow inside a goal is the model's job; the order of goals is yours." |
| Models | Bring your own: an API key, a gateway, a subscription or a local model. A separate judge model can check the assertions. |
| What the model sees | A redacted text snapshot of roles, names, text and states; no raw HTML, cookies or headers; passwords masked; secrets replaced by name, and no screenshot after a secret is filled. |
| Agent tooling | `e2e init` installs a skill in `.agents/skills/e2e/` (linked from `.claude/skills/`) and MCP configuration for inspecting the app. |
| Other parts | `e2e explore`: an agent explores a goal without a test and reports findings with severity, steps to reproduce and screenshots. A GitHub package posts results on pull requests. |
| Telemetry | Anonymous usage data on by default; off with `E2E_TELEMETRY_DISABLED=1`. |

### How the replay works

From [Caching agent steps](https://github.com/tester-army/e2e/blob/main/docs/cache.mdx):

- **Recorded only when checked.** The actions of an `agent.act` step are recorded after a later check confirms the result. `agent.assert`, `agent.waitFor` and `agent.extract` always run live.
- **Replayed by meaning, not by position.** A replay checks the starting route, finds each recorded control by role, name, test id and context, repeats the action, and checks the end state. Text that changes with the data (counts, dates, ids) is not used.
- **The agent takes over on drift.** When a control or the end state no longer matches, the agent continues from the current screen with a record of what ran and why replay stopped. Each run reports steps as replayed, handed off or missed, with a reason.
- **A recording belongs to its input.** An entry is keyed by test, target, instruction and params. Renaming, changing the instruction or a param, or a minor version of the driver causes a miss; changing the model does not. Values that change on every run are wrapped in `unique()`.
- **Stored as files.** Each entry is a JSON file in `.e2e/cache/`. By default it is ignored by git and read-only in CI; committing it shares replays, "treat committed entries as test data and review them in the pull request". `--no-cache` rules the recording out of a failure.
- **Custom agents replay too.** An action taken through the runner's checked action methods is recorded and replayed the same way, whatever agent loop chose it.

## Why it fits ViViEfs

- **The general idea.** Open-ended work by an agent, then a durable, deterministic record that runs without it, checked on every run, and handed back to the agent only where reality changed. vivief called this the deterministic-first path: a skill that stabilizes moves to hybrid and then to code, each step raising trust, and "push as much as possible into the deterministic world" (see I25).
- **The same shape as our durable workflow.** A workflow's body re-runs on resume and replays stored activity results from its journal (D2). e2e replays recorded actions instead of model calls. Both keep the expensive or non-deterministic part once, as data, and replay it.
- **The same driver as our gates.** We already drive the simulator through agent-device in `tools/qualification`, by the accessibility tree with `testID` and `accessibilityLabel` and never by screen coordinates (`AGENTS.md`). e2e's mobile driver is built on agent-device and finds controls the same way.
- **One runner for web and mobile.** `verify`'s `e2e-web` step is a Playwright web smoke that has no tests yet, and the app shell (P12, P13) will need the same flows on iOS, Android and web (I13). One test file per flow, run on every target, fits a reference stack.
- **Records as evidence.** A committed recording is reviewable test data, like the ledger and evidence notes: what the agent did, why it passed, and what changed when it was handed off.
- **Exploring before a test exists.** `e2e explore` turns a goal into findings with steps to reproduce; those could become regression tests, issues or the first draft of a gate's probe.

## Tensions to look at

- **Deterministic checks.** D48' says no retries, and flakiness is a defect. `agent.assert` and the other judgments always call a model, so a run is only deterministic where it uses locators, `expect` and replayed actions. Which steps may use a live model in `verify`, and which only outside it?
- **Cost and keys.** Model calls in CI need a key and a budget; a read-only committed recording needs none until the app changes.
- **Telemetry.** On by default; this repo prefers local-first (D45'), so it would be switched off.
- **Maturity.** Pre-1.0 and changing fast; a pin and an upgrade path like the other pinned tools.
- **Skills.** `e2e init` installs its own skill; the skills tree is checked against `skills-lock.json` (`pnpm verify skills`), so it would be vendored like the others.

## Questions for the brainstorm

- Do we organize the end-to-end tests of the app shell and the guides' exemplars with e2e, on web, iOS and Android, and what stays in Playwright, Storybook and the gates?
- Which runs are allowed to call a model, which must replay only, and do committed recordings become part of the evidence?
- Can a gate's probe on a device be written as an e2e test with agent-device underneath, and what would that add to or take from qualification?
- Where else does "an agent records a durable, replayable version" apply: skills that become code, design reviews that become checks, an explored flow that becomes a lesson that plays one step at a time (I25), discardable artifacts that become kept ones (I24)?
- How does a replay's "handed off" or "missed" result reach a human: in `verify`'s output, on the pull request, as an issue?

## Comments
