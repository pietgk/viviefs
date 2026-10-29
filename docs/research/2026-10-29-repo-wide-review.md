# Repo-wide review - 2026-10-29

ViViEfs has a coherent purpose and a strong shared-contract foundation. Its encoded checks pass and the existing teaching path works for a fresh agent. The highest-impact defect found is a journal identity collision that silently skips a distinct workflow activity. Other findings concern evidence that overstates execution or acceptance, generated proof criteria that disappear, and onboarding material describing an earlier repository state.

This is an assessment of the first-party repository at a pinned commit. It does not accept a guide, amend a decision, or establish a claim by prose.

## Review baseline and method

- Commit: `2dbaf83f24b2a974497ecaf025051c82f6c19f2b`, fetched from updated `origin/main` after the evidence-client rename and stable Effect update.
- Branch: `review/repo-wide-2026-10-29`. Worktree: `/private/tmp/viviefs-review-2026-10-29`. The original workspace was not changed by review edits.
- Toolchain: Node 22.23.2, pnpm 12.5.1, Bun 1.4.2, Java temurin-17.0.19+10, from `mise.toml`. Dependencies installed with the frozen lockfile.
- Three independent review lanes covered code/architecture, docs/consistency, and goals/evidence before findings were reconciled. A separate fresh-context agent performed the learner walkthrough in a disposable checkout.
- Standards compliance, contract/intent compliance, and challenges to the design are assessed separately. Repo decisions and vocabulary override generic architectural preferences. Existing issues are distinguished from new findings.
- All 28 declared first-party projects received a coverage disposition. Depth varies and is documented below. Vendor trees and locked skills were references; their first-party integration was reviewed.
- Findings-first scope: no production, existing tests, configuration, canonical design, or teaching source was repaired. Allowed outputs are this report, its HTML view, research-index entries, machine-generated qualification records, ignored artifacts, and disposable exercise edits. No commits, pushes, issues, or public shares were made.

## Four assessments

| Area | Assessment | Evidence and practical limit |
| --- | --- | --- |
| Code quality | Strong foundation, confirmed correctness and composition gaps | One shared store contract and suites, typed errors, exact coverage ownership, and controls are substantive strengths. Distinct journal names can collide; compaction/rebuild and interaction lifetimes need qualification before app adoption. |
| Documentation quality | Useful teaching, misleading entrypoints and generated claims | A fresh agent solved all five exercises without solutions. Root status docs still describe a pre-code repository, and every Claims proof criterion is missing from its generated view. Human learning remains untested. |
| Consistency | Weaknesses cluster where one source becomes another representation | All-skipped evidence, ignored collector rejection, stale emitted version metadata, and the Claims parser each permit a convincing output without the intended underlying proof. |
| Goal alignment | Direction is coherent; app creation benefits are only partly demonstrated | The twelve-concept trace is explicit below. Integrated app use, consumer reuse, human comprehension, and guide acceptance remain planned evidence, not established outcomes. |

## Fresh runtime evidence

The original tree was clean. Reports were written after qualification completed, so they did not dirty its baseline.

| Check | Command | Outcome | Limit |
| --- | --- | --- | --- |
| Full repository verification | `CI=true mise exec -- pnpm verify all` | Green: 21 PASS, 1 SKIP across all five stages | `e2e-web` is explicitly skipped because no project declares that target. Storybook is jsdom-based. Green is not a statement of complete end-user coverage. |
| Before-run freshness | `mise exec -- pnpm ledger` | P01-P11 stale; P12-P17 not run | Earlier passes did not qualify the updated commit. |
| Sequential qualification | `mise exec -- pnpm qualify --through P11` | All eleven selected gates passed; unchanged committed source confirmed | P12-P17 are intentionally unimplemented. P07 overstates notification evidence; see R04. P03 measured simulators, not a new physical-device run. |
| After-run freshness | `mise exec -- pnpm ledger` | P01-P11 current pass, P12-P17 not run | Cumulative status alone is not sequential closure; this run also retained the sequential result. |
| Production docs | `mise exec -- pnpm docs:prod` | Built and served separately on port 4322; existing port 4321 left alone | Browser inspection supplements structural build checks; it is not a comprehensive accessibility audit. |
| Learner exercises | `mise exec -- pnpm exercise log-store <id>` | Five intended initial failures, five passing first reruns after problem-file edits | No solution files read. Agent usability evidence only; no human acceptance or comprehension inference. |

Qualification run: `2026-10-29T13-30-43.662Z-52020441`, from 13:30:43 to 14:09:21 UTC, about 39 minutes. Its result records `sequential: true`, `sourceUnchanged: true`, the pinned commit, and input digest `2f0ed7463268d409825fe0b3e857940f40d9d64fb04152a7bd72062bf2f71f62`. The machine-written ledger contains the eleven new entries. It is not edited by this report.

Controls were exercised in the retained probes. Expected failing controls are recorded as failures of the broken variant followed by PASS of the control; they are not failed normal-device runs. This distinction is particularly visible in the identity checks. The notification fallback caveat remains a finding even though the selected gates returned zero.

Browser inspection confirmed 34 fallback proof fields on Claims, no page-wide overflow at 390px or 1200px on the entry page, and no page-wide overflow or broken images on all ten log-store guide pages at 390px. Detailed records and screenshots remain in ignored artifacts. The screenshot wrapper twice reported failure despite writing the requested PNG; these files were checked directly. This was a tool-reporting limitation, not a product rendering failure.

## Findings

Severity describes impact, while confidence describes evidence. High is the demonstrated work-skipping defect. Medium findings merit repair or explicit claim correction; Low findings are concrete documentation inaccuracies. Planned gaps and architecture concerns are separate below.

| ID | Area | Severity | Classification | Finding |
| --- | --- | --- | --- | --- |
| R01 | Code | High | Defect | [Distinct activity names can skip work](#r01-distinct-activity-names-can-skip-work) |
| R02 | Consistency | Medium | Defect | [Skipped tests can satisfy the evidence gate](#r02-skipped-tests-can-satisfy-the-evidence-gate) |
| R03 | Docs | Medium | Defect | [Every Claims section loses its proof criteria](#r03-every-claims-section-loses-its-proof-criteria) |
| R04 | Goals | Medium | Unsupported claim | [Notification qualification can bypass the tap](#r04-notification-qualification-can-bypass-the-tap) |
| R05 | Code | Medium | Defect | [Collector rejection disappears from export results](#r05-collector-rejection-disappears-from-export-results) |
| R06 | Consistency | Medium | Contradiction | [Fresh qualification emits stale dependency versions](#r06-fresh-qualification-emits-stale-dependency-versions) |
| R07 | Docs | Medium | Contradiction | [Primary onboarding says no code exists](#r07-primary-onboarding-says-no-code-exists) |
| R08 | Docs | Low | Contradiction | [Guide overstates database-independent SQL](#r08-guide-overstates-database-independent-sql) |
| R09 | Docs | Low | Contradiction | [Canonical procedure names a missing gate-table path](#r09-canonical-procedure-names-a-missing-gate-table-path) |

### R01 Distinct activity names can skip work

- Classification: defect, current contract compliance.
- Severity: high. Confidence: confirmed via the public workflow and activity APIs.
- Sources: [libs/datom/src/ids.ts:31-32](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/datom/src/ids.ts#L31); [libs/datom/src/ids.ts:56-68](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/datom/src/ids.ts#L56); `libs/workflow-engine/src/engine.ts` activityExecute stored-exit lookup; [libs/datom/src/ids.test.ts:43-44](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/datom/src/ids.test.ts#L43) only exercises separated slash and tilde characters.
- Requirement: strict-composition identities and durable activities must keep different activity names distinct; replay must reuse the result of the same activity, not an unrelated one. Relevant existing intent: ADR-0010 and ADR-0012, plus the P06 crash/replay promise.
- Observation: `encodeIdSegment` first doubles tilde and then replaces slash with tilde. Thus `folder//read` and `folder~read` both encode as `folder~~read`. The decoder maps the first original name to the second.
- Reproduction: a new workflow executes two sequential activities named `folder//read` and `folder~read`, each returning its own name and recording whether its body ran. The result is `["folder//read", "folder//read"]`, and only `folder//read` appears in the executed-body list. The second body is silently skipped because the first result occupies its journal entity. No restart, fake storage layer, or fault injection is required.
- Artifacts: `.artifacts/repo-review/code/activity-name-collision.ts` and `.log`.
- Existing issue: none found by searching the local tracker for the codec and encoding collisions. The planned entity-id minting issue I67 does not describe this journal-name encoding collision.
- Recommended action: specify an injective segment codec and its compatibility policy before changing shipped encodings. Add roundtrip and injectivity checks for consecutive slash/tilde combinations and an end-to-end two-activity reproduction to the workflow suites. Frozen persisted names/ids mean the repair needs an explicit compatibility decision, not an incidental escaping change.

### R02 Skipped tests can satisfy the evidence gate

- Classification: defect in verification, current contract compliance.
- Severity: medium. Confidence: confirmed through the public evidence judge; producer encoding independently checked.
- Sources: [tools/verify/src/evidence.ts:74-79](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/tools/verify/src/evidence.ts#L74); the rendered-ui and process-entry branches in `judgeEvidence`; [tools/verify/src/file-treatments.ts:22-30](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/tools/verify/src/file-treatments.ts#L22).
- Requirement: a rendered component's stories and a process entry's named test must run and pass. Evidence that never executes should not satisfy those treatments.
- Observation: `testFileOutcome` checks only that there is at least one assertion and that no assertion has a status outside `passed` or `skipped`. A report containing only `skipped` assertions returns no problem. Rendered UI is not then subjected to a coverage verdict.
- Reproduction: feed `judgeEvidence` one rendered-ui subject and one process-entry subject, both with matching test-report files containing a single skipped assertion and empty coverage maps. It returns `{ "issues": [], "tuples": {} }`. The installed Vitest 5.0.1 JSON reporter uses `skipped` for this outcome (`node_modules/vitest/dist/chunks/index.DzobfTyw.js:17836`), so this is not an invented status spelling.
- Artifacts: `.artifacts/repo-review/code/skipped-evidence.ts` and `.log`.
- Existing issue: none found in the local tracker for all-skipped evidence.
- Recommended action: require at least one passed assertion for a named evidence file, retaining the failure check. Decide explicitly whether partial skips are acceptable for the particular file treatment; do not silently make all-skipped equivalent to proven.
- Limitation: this reproduction exercises the gate's public judgment function, not a modified full repository run. No real story file was edited or skipped during this review.

Coordinator corroboration used a real Vitest 5.0.1 it.skip JSON report: the skipped assertion and empty coverage map produced no issues from judgeEvidence. No real repository story was disabled.

### R03 Every Claims section loses its proof criteria

- **Source:** [apps/docs/src/lib/claims.ts:25](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/apps/docs/src/lib/claims.ts#L25), with fallback rendering at lines 90 and 92. Actual input starts at [docs/plan/bootstrap/06-qualification-gates.md:17](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/docs/plan/bootstrap/06-qualification-gates.md#L17).
- **Rule:** the Claims page must show how each claim is proven and its positive control. This is the documented purpose of the generator (`claims.ts:1-6`) and D93. A generated view must preserve its canonical input.
- **Evidence:** `parsePlanRows` recognizes only rows starting `| **Pnn** `. All 17 real rows start `| <a id="pnn"></a>**Pnn** `. Read-only inspection counted zero compatible rows and 17 anchored rows. The built `apps/docs/dist/reference/claims/index.html` contains 34 instances of `set by its grilling` and zero instances of `compaction horizon`, confirming that every real pass condition and positive control has been replaced by the unset fallback.
- **Impact:** a reader following any gate reference is told the proof criteria have not been specified, even for P01-P11. This removes the central explanation of what the evidence establishes and how its checks detect failure. The site can build successfully while communicating substantially less than its source.
- **Tests:** [apps/docs/src/lib/claims.test.ts:38-39](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/apps/docs/src/lib/claims.test.ts#L38) uses an unanchored fixture, so the tests do not exercise the real gate table shape. Add a real-repository input assertion, as well as anchored-row coverage, when fixing it.
- **Reproduction:** open `/reference/claims/#p04-log-store-conformance` on the production docs server. Compare Proven when and Positive control against the P04 source row at `06-qualification-gates.md:20`.
- **Confidence:** high, source and actual built output agree. **Disposition:** new defect. I22 concerns overlap between claims and evidence views, not missing proof criteria.

Coordinator confirmation: the served production page contained 34 fallback fields. The actual P04 section says both proof fields are set by its grilling, despite defined source criteria. Browser snapshot and PNG are retained.

### R04 Notification qualification can bypass the tap

- Classification: known defect and unsupported claim, not newly discovered product behavior. Severity: medium; consequential before relying on notification wake. Confidence: high from the executable path; the fresh device reproduction is recorded below.
- Evidence: [tools/qualification/src/probes/p07.ts:357-391](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/tools/qualification/src/probes/p07.ts#L357) handles two failed notification interactions by relaunching the app and calling `globalThis.__viviefsP07Complete?.()` with Hermes evaluation. At line 407 it then states that the notification completed the deferred. The final summary at line 500 claims notification completion too.
- The gate's actual requirement includes a scheduled notification tap completing the deferred: [docs/plan/bootstrap/06-qualification-gates.md:23](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/docs/plan/bootstrap/06-qualification-gates.md#L23). A manual completion hook demonstrates deferred completion after relaunch, not the specified notification journey.
- Existing issue: [docs/issues/0014-physical-devices-and-notification-tap.md:11](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/docs/issues/0014-physical-devices-and-notification-tap.md#L11); `tools/qualification/README.md` also acknowledges the fallback. Tracking the gap is good, but retaining the broader gate pass makes the machine evidence stronger than the observation.
- Impact: a maintainer can rely on P07's pass while the very notification path needed by the evidence-collection exemplar remains broken or unverified.
- Recommendation: preserve the diagnostic fallback as a separately labelled observation, but fail or explicitly withhold the notification part of qualification until a real tap succeeds and a response-derived completion is observed. Confirm the no-sweep control separately. Do not silently rename the gate or weaken its requirement.

Fresh-run confirmation: the P07 log says notification tap missed and relaunching for last-response / complete hook for both iOS and Android, then states notification completed the deferred and records a pass. Force-quit resume and the no-sweep control did run successfully; the real tap-completion claim remains unsupported.

### R05 Collector rejection disappears from export results

- Classification: defect in rejection observability and contract wording, plus an unsupported backend-acceptance guarantee.
- Severity: medium. Confidence: confirmed against a real local HTTP receiver.
- Sources: [libs/telemetry/src/trace-sink.ts:109-125](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/telemetry/src/trace-sink.ts#L109); [libs/telemetry/src/trace-projector.ts:113-116](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/telemetry/src/trace-projector.ts#L113); `ExportResult.spans` is documented as spans the sink acknowledged. ADR-0018 Expected says lossless replay-stable traces; the TraceSink contract says send succeeds only when the sink acknowledged the batch.
- Reproduction: a localhost OTLP receiver returns HTTP 200 with `{ "partialSuccess": { "rejectedSpans": "1", "errorMessage": "collector refused every span" } }` for a one-span batch. The exporter ignores the body, reports one exported/acknowledged span, advances its cursor from 0 to 2, and exposes neither rejection count nor diagnostic.
- Artifacts: `.artifacts/repo-review/code/otlp-partial-rejection.ts` and `.log`. The receiver ran on an ephemeral loopback port and was closed after the measurement.
- Protocol nuance: the official [OTLP HTTP partial-success specification](https://opentelemetry.io/docs/specs/otlp/#partial-success-1) explicitly prohibits automatically retrying a partial-success request. Cursor advancement by itself is therefore not evidence of a retry-policy violation. The bug is silent rejection and the false full-acknowledgment result; keeping the cursor unchanged and blindly retrying would be an incorrect repair.
- Recommended action: parse the response, report accepted/rejected outcomes and the diagnostic, and define a protocol-compatible durable rejection policy. Distinguish lossless derivation from the retained log from guaranteed collector ingestion. A warning with zero rejected spans is different from actual rejection. Also distinguish retryable HTTP status errors from permanent failures.
- Existing issue: none found in the local tracker for OTLP partial success.

### R06 Fresh qualification emits stale dependency versions

- Classification: documentation/implementation contradiction and evidence-integrity defect.
- Severity: low to medium, depending on how generated claims are consumed. Confidence: confirmed by source comparison.
- Sources: `tools/qualification/src/gates.ts` P02 entry; [tools/qualification/src/probes/p08.ts:124-133](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/tools/qualification/src/probes/p08.ts#L124); `features/evidence/client/package.json`; `apps/docs/src/lib/claims.ts` consumes the gate claim.
- Observation: the P02 claim says op-sqlite 17.x works on RN 0.88, while its summary and implementation use 18.2.5 and the qualification README explicitly says 17.x cannot compile. The P08 probe writes `effectMachine: '0.38.0'` and `atomReact: '4.0.0-rc.116'` into `picks.json`, despite the current workspace declaring 0.46.0 and 4.0.5 respectively. The update in I23 did not update those emitted metadata strings.
- Impact: a fresh passing gate can emit a record naming dependencies that did not run; generated Claims displays a contradictory P02 claim.
- Existing issues: I23 is resolved for the stable Effect update. This is a remaining emitted-metadata gap, not a reason to treat its actual dependency upgrade as absent.
- Recommended action: derive run metadata from the resolved/pinned package manifests and keep the claim about the version actually tested. Add a check that the recorded version equals the running implementation's version.

Fresh-run confirmation: P08 picks.json contains effectMachine 0.38.0 and atomReact 4.0.0-rc.116. Current manifests pin 0.46.0 and 4.0.5. These are emitted-metadata errors in a fresh passing run.

### R07 Primary onboarding says no code exists

- **Source:** `README.md:21-23`; [docs/plan/bootstrap/README.md:3-6](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/docs/plan/bootstrap/README.md#L3), `:19`, and `:25-27`.
- **Rule:** keep intended, implemented and verified states distinct; living entry documents must orient a fresh person or agent to the current state. AGENTS points to bootstrap as required context, and the README sends readers there.
- **Evidence:** the root README says Design phase, no production code exists, and gates are the first work. Bootstrap repeats that no production code exists, claims nothing outside the directory is needed, and presents the historical scaffolding handover as reading step zero. Actual first-party libs, apps, suites and guides exist. The current handover lists completed foundation qualification, vocabulary acceptance and the next implementation batch. [docs/plan/bootstrap/00-next-session.md:3-6](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/docs/plan/bootstrap/00-next-session.md#L3) itself clearly says its scaffolding work order is history and points to the real handover.
- **Impact:** the most prominent onboarding paths give newcomers and agents the wrong work order and an incorrect maturity assessment. This undermines the shared-language goal before a reader reaches the better-maintained current handover.
- **Reproduction:** start at the root README with no prior context, follow its only status link, then follow bootstrap's reading order. Compare the instructions with `docs/plan/next-session.md` and the guide index.
- **Remedy direction:** make the root README point to the current handover, prerequisites and usable entry task. Mark bootstrap's initial scaffolding statements as historical or replace them with a short current-status pointer. Preserve the original decisions rather than rewriting their history.
- **Confidence:** high. **Disposition:** new current entrypoint defect. Related historical status drift was previously noticed for ADR-0001 in I36, but no issue inspected covers these current README claims.

### R08 Guide overstates database-independent SQL

- **Source:** [apps/docs/src/content/docs/guides/log-store/concepts.mdx:112-115](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/apps/docs/src/content/docs/guides/log-store/concepts.mdx#L112); contradicting implementation: [libs/datom/src/log-store.ts:364-380](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/datom/src/log-store.ts#L364).
- **Rule:** a guide describes the real exemplar and the limitations a person must understand when adding an implementation.
- **Evidence:** Concepts says the SQL is the same on every store and only migration has SQLite and Postgres dialects. `compact()` explicitly dispatches using `sql.onDialectOrElse`: SQLite uses `DELETE` followed by `SELECT changes()`, while Postgres uses `DELETE ... RETURNING seq`.
- **Impact:** a person assessing another SqlClient or extending storage is told the wrong portability assumption. The shared contract remains sound; the universal-SQL explanation is inaccurate.
- **Reproduction:** read the Concepts paragraph and then follow the embedded LogStore implementation to `compact()`.
- **Remedy direction:** say the shared LogStore handles its supported dialect differences and identify migrations and compaction, avoiding a promise that all operational SQL is database-independent.
- **Confidence:** high. **Disposition:** new documentation inaccuracy; no matching existing issue found.

### R09 Canonical procedure names a missing gate-table path

- **Source:** [docs/plan/bootstrap/05-verify-qualify-teach.md:68-69](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/docs/plan/bootstrap/05-verify-qualify-teach.md#L68) names `tools/qualification/gates.ts`; the real file is `tools/qualification/src/gates.ts`.
- **Rule:** canonical process documentation must direct readers to the real source of truth. D87 requires repository paths to resolve; plan pages linked on GitHub do not benefit from all rendered-page checks.
- **Evidence:** the named path is absent, while the qualification README and Claims generator name the real src path. This paragraph also says a gate establishes one fact, whereas the glossary and D93 distinguish a claim from a datom fact.
- **Impact:** agents and people following the canonical procedure have to repair the pointer themselves and encounter terminology the vocabulary work was intended to eliminate.
- **Reproduction:** follow the gate-table code path from the Qualify section. Compare its wording against the glossary's Claim and Fact entries.
- **Confidence:** high. **Disposition:** new current-document drift. I98 broadly plans stronger checks for named identifiers; it does not itself repair this wrong path.

## Design concerns, separate from defects

These concerns challenge how well the current composition serves the accepted goals. They are not claims of failures in a finished consumer app, and no decision is amended here.

### A01 Compaction and rebuild do not compose safely

- Classification: reproduced current limitation and design concern; no active production regression demonstrated.
- Severity: medium before compaction is used by an app. Confidence: confirmed through public log store, command, and projector APIs.
- Sources: [libs/datom/src/log-store.ts:364-385](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/datom/src/log-store.ts#L364); [libs/datom/src/projector.ts:693-696](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/datom/src/projector.ts#L693); `libs/sync/client/src/client.ts` calls projector.rebuild on typed rejection. ADR-0011 Design promises disposable read models and device compaction; its Trade-offs separately says history consolidation on a full-organization replica is later than P09.
- Reproduction: create a valid list through `renameList`, append its complete changeset, and project it. The committed view contains the defining fact and title. Acknowledge the final sequence for every registered consumer and call `compact()`: all three log datoms are removed. `Projector.rebuild()` clears the read models and produces an empty committed view. There is no retained snapshot or automatic server rehydration in this operation.
- Artifacts: `.artifacts/repo-review/code/compaction-rebuild.ts` and `.log`.
- Impact: a consumer following the standalone documented capabilities can erase reconstructible local state. If app compaction were introduced before solving this, a later sync rejection or routine rebuild could remove otherwise valid data from the local view.
- Existing issue: no dedicated snapshot/compaction/rebuild issue found. The ADR acknowledges history consolidation as deferred, so this is a gap to make explicit and gate before app use, rather than a claim that an existing user journey already compacts and loses data.
- Recommended action: qualify compaction and rebuilding together. Either keep compaction unavailable until rehydration/snapshots are implemented, or define and enforce the precondition that makes a compacted replica rebuildable. Do not claim that the compaction-horizon check alone proves this composition safe.

### A02 Interaction sessions have no owned shutdown

- Classification: architecture/lifecycle concern in a retained copy target, not a shipped app-shell regression.
- Severity: medium before copying this pattern into long-lived app screens. Confidence: code inspection plus scoped public-driver reproduction.
- Sources: [features/evidence/client/src/intent-composer/effect-machine.ts:157-174](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/features/evidence/client/src/intent-composer/effect-machine.ts#L157); [features/evidence/client/src/intent-composer/driver.ts:14-24](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/features/evidence/client/src/intent-composer/driver.ts#L14); the session exposes snapshot/send/subscribe but no disposal method and its start effect does not require a caller Scope.
- Observation: start allocates a fresh Scope, passes it to Machine.start, and launches the changes stream with Effect.runFork. Nothing closes that Scope. Unsubscribing a screen removes its listener only. XState and Atom retained comparison drivers similarly omit actor.stop/registry.dispose from the shared session contract.
- Reproduction: start the effect-machine driver inside `Effect.scoped`, send the compose/candidate/confirm sequence, and wait until submitting. Exit the creator scope. The submit still completes and the actor changes state afterward; the returned session has no method to end its lifetime.
- Artifacts: `.artifacts/repo-review/code/composer-lifetime.ts` and `.log`.
- Impact: each newly created session can retain an actor and a changes subscription indefinitely. The P08 checks establish transitions, not that sessions release resources. Continuing a durable command after navigation may be intentional, but it does not require retaining the abandoned interaction owner forever.
- Existing issue: I13/P12 track the native UI/app-shell gap, but no explicit session-lifecycle check found.
- Recommended action: before adopting the copy target in the app shell, bind the actor and stream to an owner Scope or expose a disposal operation, with a teardown check. Separate lifetime of an accepted durable command from the screen's ephemeral interaction state.

### A03 Suite evidence is not tied to each implementation

Evidence: `tools/verify/src/evidence.ts:69-72,152-156` accepts any passing test with the suite tag anywhere in the producer report. Both Postgres and sqlite-node entries require the same suite tags (`tools/verify/src/evidence-registry.ts:232,236`). It is possible for a passing suite on one implementation plus ordinary execution coverage of the other to satisfy both entries. Coverage counts cannot show that the second implementation passed the contract suite.

The present integration files genuinely execute the matrices on both stores. This is a limitation of the guardrail, not evidence that current conformance is failing. It matters because a foundation pattern promises that every implementation passes the same suite ([docs/adr/0032-what-viviefs-is-about.md:100](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/docs/adr/0032-what-viviefs-is-about.md#L100)). A stronger alternative is evidence keyed by `(suite, implementation)` with an explicit required run matrix and a hostile fixture deleting one matrix cell. Retain the existing per-file coverage checks for regression detection, but do not treat them as proof of per-implementation conformance.

Existing issue: no exact issue found. Confidence: high on the guardrail limitation, medium on the need to prioritize a redesign before more implementations arrive.

## Goal versus implementation

The accepted purpose combines proven parts with learning in one shared language. The code and evidence machinery substantially support the first half. The exercise results provide a useful first observation for the agent-learning half, while leaving the human audience and integrated app creation unverified.

The most useful next proof is the intended single evidence-collection journey after the already scheduled correctness/security work: capture, retry, second-person review, reminder, crash/resume, and handoff. That will test whether the individually qualified parts compose coherently. Adding another isolated green probe or a second exemplar would not answer the same question. This recommendation follows the accepted direction and does not treat scheduled unfinished work as a regression.

The canonical set and ordering is the foundation table in [ADR-0032](../adr/0032-what-viviefs-is-about.md). The matrix describes the reviewed implementation. All implemented gates through P11 have the fresh passes recorded above, within their current scope. Those passes do not prove pending extensions or remove R04's notification limitation.

| # | Goal and owning pattern / contract | Implementation inspected | Tests, qualification and limits | Teaching and existing backlog | Current assessment |
| --- | --- | --- | --- | --- | --- |
| 1 | Pattern: one promise, multiple implementations; every owning pattern has a contract and suite. | `LogStore` service in [libs/datom/src/log-store.ts:33](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/datom/src/log-store.ts#L33); Layers in sqlite-node, Postgres, native and wasm store libraries; suite catalogue in `libs/testing/src/suites.ts`. | Log-store and changesets conformance suites execute on sqlite-node/PGlite and platform probes; P04 fresh within existing scopely passed. See D1 for the producer-level evidence limitation. | Only the log-store guide and exercise track exist; guide draft; I2 acceptance, I21 learner test. | Concrete reusable pattern exists, full delivery not established. |
| 2 | Datom and one log: retain facts, one contract per organization; owning log-store pattern. | [libs/datom/src/schema.ts:11](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/datom/src/schema.ts#L11), `log-store.ts`, `migrate.ts`, `hlc.ts`, `ids.ts`; SQL-backed store Layers. Authority log retained; device compaction has acknowledgement horizon by ADR-0011. | `libs/datom/src/suites/log-store.ts`, HLC/ids tests and each host implementation's conformance run; P04 fresh within existing scope. | Draft log-store guide, lessons and exercise track; I66 attribute Schemas/typed reference models, I67 id minting, I68 uniqueness. | Built core with explicitly scheduled type/layout changes. Device compaction and permanent authority history are distinct and intentional. |
| 3 | Command and changeset: pure command decides a batch rather than writing; owning changesets. | `features/evidence/model/src/command.ts` returns `CommandChangeset`; `libs/datom/src/manifest.ts`, `projector.ts`. | P05 conformance checks manifest completeness, abort/expiry and visibility; `tools/qualification/src/probes/p09-checks.ts` exercises commands through sync; P05 fresh within existing scope. | Changesets guide planned; I69 registered commands/declared writes/shared rules, I66 typed attribute values. | Pure commands are real; declared command registration and complete validation are pending. |
| 4 | Authority and accept: access, structure, data validity; owning changesets acceptance rules. | [libs/sync/server/src/server.ts:440](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/sync/server/src/server.ts#L440) accept; checks membership/actor/manifest/catalog/org/files/lease/write-once. | P09 and P11 suites cover existing checks; no `changesets/acceptance` suite yet. Blank title bypass is explicitly known. | No guide; I69 acceptance rules and command registry, I71 atomic accept/revocation race, I84 access contract. | Partial and accurately tracked. A green existing P09 must not be read as proof of newer acceptance-rule intent. |
| 5 | Read model and projector: disposable derivation equals rebuild; owning changesets. | `libs/datom/src/projector.ts`, `read-models.ts`, `visibility.ts`, `keys.ts`. | P05 `reactivity keys` and `rebuild equals incremental` checks at `libs/datom/src/suites/changesets.ts:606,649`; reducer/key unit tests; P05 fresh within existing scope. | Log-store guide distinguishes these table kinds but changesets guide planned; I66 typed read model, I81 authoritative conflicts. | Built derivation/rebuild core, conflict semantics and typed models still changing. |
| 6 | Presenter, frame, presentation surface: a query-as-data has a current answer and subscription; owning Presenter. | SQL read models and [features/evidence/client/src/intent-composer/query-atom.ts:7-28](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/features/evidence/client/src/intent-composer/query-atom.ts#L7) provide the precursor reference read path and reactivity. No explicit general Presenter contract or query-as-data implementation found. | P05/P08 prove parts only. I62 specifically says no Presenter conformance gate exists; no second implementation compared at the same query and tx. | No Presenter guide; I62 gate, I63 columnar implementation; P12/P13 app shell. | Decided direction, partial precursor code, not a qualified interchangeable Presenter pattern. |
| 7 | Origin and origin trust: lineage and trust withdrawable without rewriting history; owning origin trust. | Existing Envelope has actor/device/command but no origin ([libs/datom/src/schema.ts:34-48](https://github.com/pietgk/viviefs/blob/2dbaf83f24b2a974497ecaf025051c82f6c19f2b/libs/datom/src/schema.ts#L34)). No trust-level calculation or frame companion columns found. | No origin-trust suite or named gate yet. | No guide; I64 explicitly owns implementation and gate when first enriching implementation is picked up; I15 signing context. | Deliberately deferred, not delivered. Never infer trust from authenticated identity alone. |
| 8 | Durable workflow and journal: preserve progress and replay; owning durable-workflow. | `libs/workflow-engine/src/engine.ts`, `journal.ts`, `sweep.ts`, `wake.ts`; activity Exit values and persistent journal. Lease service remains pending replacement by the journal fence. | `durable-workflow-crash-matrix.integration.test.ts` runs full matrix on both host stores and memory negative control; exit replay, launch sweep and trace suites; P06/P07 fresh within existing scope. R04 limits notification proof. | No durable-workflow guide; I80 journal fence, I71 atomic append, I14 notification/physical devices. | Working persistence/replay core; new journal-fence design and notification user path unqualified. |
| 9 | Sync: offline outbox up, missed facts down, conflict decided once at accept; owning sync. | `libs/sync/protocol/src/rpc.ts`, client `client.ts` and `replica.ts`, server `server.ts`; outbox/rejection/rebuild, cursor stream and blobs. | `tools/qualification/src/probes/p09-checks.ts` sync/protocol suite and P11 membership suite; P09 fresh within existing scope. No two-device human-conflict proof for the new design. | No sync guide; I81 basis and authoritative conflicts, I11/P14 rejected-content quarantine, I12 partial sync, I60 server-independent mode. | Core replication built, human conflict and future topology deliberately partial. |
| 10 | Identity and access: accountable writes and one consistent access decision; owning identity and access. | `libs/identity/src/token-verifier.ts`, `oidc.ts`, sign-in session, caller; membership checks in sync server, per-account replica naming and native sign-in. | Fake/OIDC shared token verifier suite, hostile-token control, P11 membership and device sign-in controls; P11 fresh within existing scope. Existing distributed checks are not yet the accepted single access contract. | No identity/access guide; I84 access contract and operator actor, I71 revocation race, I16 roles, I17 local deletion, I18 provider migration. | Identity and organization checks built; accepted access pattern and grant accountability scheduled. |
| 11 | Encryption that narrows: confidentiality cannot grant access; owning encrypted store. | `libs/crypto-shred/src/index.ts` is an empty named slot. No qualified SQLCipher store, subject-key destruction or attribute encryption-level implementation found. | P15/P16 intentionally unimplemented. They must remain not run/unverified. | No guide; ADR-0023 proposed; I10 consumer encryption choices, I15 trust/keys, P15/P16 future gates. | Accepted intent and deliberately unbuilt capability, not a code defect by itself. |
| 12 | Tamper-evident history: each device detects edited accepted history; owning log-store. | Changeset manifest hash checks batch membership, not history chaining. No chained previous hash or device history verification found in Envelope/accept/Pull. | No edited-history pull control yet; new P09 extension belongs to I85. Existing P09 cannot prove this claim. | No guide; I85 canonical encoding/chain/device alarm/audit tool, after I80; ADR-0038 proposed. | Explicit planned security feature. Current stored history is trusted, not cryptographically proven. |

## Fresh learner walkthrough

A fresh-context agent used a separate pinned disposable checkout, reading the published entry and linked guide/glossary/ADR material before exercises. No audit report or solution directory informed the attempts. Only problem files were edited. Runtime logs and the resulting diff are retained.

| Exercise | Initial observed failure | Change inferred from the material | Result |
| --- | --- | --- | --- |
| 01.01 append and stream | Retry inserted three new facts rather than duplicates | Mint each datom once and reuse it on send | First rerun passed |
| 02.01 mint | Same-millisecond mint was not above the previous value | Preserve logical time, increment counter, handle overflow | First rerun passed |
| 02.02 receive | Future clock at +5001ms was accepted | Reject strictly beyond the +5000ms bound | First rerun passed |
| 03.01 compaction horizon | Expected facts 5-10 retained; received none | Export after sink cursor, acknowledge delivered batch, then compact | First rerun passed |
| 04.01 a store Layer | HLC reboot check failed on in-memory database | Use a stable database file within the supplied directory | First rerun passed |

The transfer answer correctly described shared SqlClient/LogStore Layer composition, durable database ownership, host versus platform conformance, per-file evidence ownership, persistent clock/cursor state, and delivery-before-acknowledgement. Coordinator comparison with How-to, Testing, and Review confirmed those points and identified details the learner would still need: layer:adapter tags, metadata.guides/README linkage, runLogStoreChecks and suite tagging, and both log-store and changesets qualification. The learner explicitly acknowledged uncertainty about registration details; no unsupported mastery claim is made.

Orientation friction was concrete but limited: the detailed exemplar journey required following Glossary to the purpose ADR; the entry initially sounded narrower than the app-creation purpose; the learner guessed two filenames instead of following exact paths; a dated process outcome still saying no guide exists had to be interpreted against the current guide index. These observations support better onboarding, not a conclusion that the guide failed to teach the five exercised concepts.

The final independent learner conversation ended with an agent usage-limit error after all five passing logs and the transfer answer had been saved. Coordinator completed the source comparison afterward. The author did not coach the solutions, but that final comparison is not an additional independent learner attempt. Human comprehension, especially outside software, remains unverified.

## Coverage

### First-party code projects

Depth means source and contract review within this lane, not a claim to have independently rerun each entire suite. The coordinator owns full verification and device/lab qualification. Approximately 345 first-party TypeScript/TSX files were inventoried; the repository has 28 declared project.json projects plus root/workspace configuration. Historical and vendored sources were references only.

| Project | Coverage and disposition |
| --- | --- |
| apps/docs | Read loader, route/link, claims and sample-extraction code and test structure. Rendered UX and prose belong to independent docs lane. Stale gate claim propagation found. |
| apps/evidence-client | Reviewed composition, gate selection, P07/P11 action flow and runtime/config boundaries; retained P01-P05 runtime code inspected selectively. Coordinator owns device checks. No claim of independent line-by-line review of all device probes. |
| apps/evidence-server | Reviewed server composition, OIDC and membership wiring, configuration and integration test coverage, including known I71. |
| features/evidence/client | Reviewed interaction contract, three implementations, screen/view, settled-text integration, query atom, and transition checks. Lifecycle concern C06. |
| features/evidence/model | Reviewed renameList/sealItem changesets and device-resume workflow; used renameList in C03 reproduction. |
| features/evidence/server | Confirmed explicit named-slot/no runtime implementation; not treated as production completion. |
| libs/blobs | Reviewed per-organization content-hash in-memory implementation and sync upload enforcement. Durable device/object storage remains later implementations. |
| libs/crypto-shred | Confirmed explicit named slot until its gate; not tested as if implemented. |
| libs/datom | Deep review of log-store, HLC, ids, manifest, catalog, projector, visibility, migrations and suite composition. C01 and C03 reproduced; concurrent mint hypothesis tested on SQLite and PGlite and not reproduced. |
| libs/identity | Reviewed token verification, OIDC discovery/PKCE/session/vault ownership and tests. No newly confirmed authentication bypass. Concurrent sign-in speculation not promoted to a finding because P11 serializes user actions. |
| libs/platform-native | Reviewed notification scheduling/decoding, sign-in ports, wake scheduler and polyfill integration. Runtime truth deferred to coordinator's device measurements. |
| libs/references | Reviewed shared catalog, source rewrite and their-words parsing; tests and cross-consumer integration inspected. No new confirmed defect in this lane. |
| libs/store-postgres | Reviewed PGlite lifecycle and drain-before-close implementation; exercised public layer in concurrent-mint negative investigation. |
| libs/store-sqlite-native | Reviewed layer wiring, deletion and documented external declaration exception. Device conformance owned by coordinator. |
| libs/store-sqlite-node | Reviewed SQL layer wiring and suites; used real SQLite for all storage/workflow reproductions. |
| libs/store-sqlite-wasm | Reviewed worker lifecycle, readiness bound, filename bound and deletion path; coordinator owns browser conformance. |
| libs/sync/client | Reviewed outbox/push/pull, local abort/rebuild, account replica naming, authentication and failure preservation. Known access/conflict work distinguished from bugs. |
| libs/sync/protocol | Reviewed RPC schemas, authentication middleware, typed rejection contract and deferred completion shape. |
| libs/sync/server | Deep review of membership commands, bearer identity, accept checks, organization filtering, lease/write-once checks and authority operations. Existing I71/I69/I81 gaps mapped. |
| libs/telemetry | Reviewed durable-span derivation, sink, cursor exporter and projection suite; C04 reproduced against actual HTTP. |
| libs/testing | Reviewed exercise mode/verdict, suite tags, common Vitest config, unscoped-runtime helper and cleanup helpers. |
| libs/ui | Reviewed settled-text behavior and exercise/story integration. No new confirmed hook defect. |
| libs/workflow-engine | Deep review of activity/deferred replay, run and clock ownership, handoff, journal encoding, exit tests and crash-suite structure. C01 demonstrated end-to-end. |
| tools/generators | Confirmed explicit empty named slot. No implementation to review. |
| tools/qualification | Reviewed CLI source-fingerprint invariants, ledger, process timeout handling, gates, and selected P08/P10/device driver internals. Coordinator owns complete probe execution and positive controls. C05 metadata contradiction. |
| tools/refs | Reviewed CLI target/path scoping, shared reference consumption and write-time hook design. No tracked invocation of fix was performed. |
| tools/verify | Reviewed stage selection, docs-only selection, ownership/treatments, evidence/coverage/provider provenance, skill locks, research index and selected tests. C02 confirmed. Full run owned by coordinator. |
| exercises/log-store | Reviewed exercise harness contract and authored problem/solution test structure; fresh-context learner lane owns actual exercises. |
| Root/workspace/CI | Reviewed pinned toolchain and package manifests, Nx/tag structure, strict TypeScript configuration, script boundaries and CI wiring. CI sets CI=true and runs the canonical verify entry. No changes made. |

### Documentation areas

This was a broad source audit with detailed checks concentrated on user entrypoints, the complete existing guide, evidence presentation, and the documents that can misstate completion. It is not a claim that every historical issue comment or every research sentence has been revalidated.

| Area | Coverage performed | Disposition |
| --- | --- | --- |
| Root docs and agent map | Read README, AGENTS, glossary structure/definitions and current handover; compared entry order and states | DOC-02; current handover and glossary correctly distinguish a number of decided-but-unbuilt items |
| Bootstrap and living plans | Read vision, architecture, validation process, qualification table, risks/Schedule, map indexes, guide/ownership specs; inspect historical handover labels and source pointers | DOC-02 and DOC-04. Historical `00-next-session`, `bootstrap-check`, the P11 handover and inventory rows are dated context, not current work orders |
| ADRs, index and template | Inventory all 38 ADRs' status/gate/summary/observed metadata; read the pattern-design sections, amendments and related status rules, with detailed reading of log-store, identity, verification, purpose and recent foundation decisions | No new status transition was assumed. Old and amended designs must be read together; ADR-0009/0035/0036/0037/0038 explicitly name further qualification or build issues. Early undated Observed text can be stale, but dated measurements were not treated as current claims |
| Authored docs pages | Read all 13 authored Markdown/MDX pages, including all 10 log-store guide pages, and the seven template pages | DOC-03. Guide remains draft, no pattern is claimed delivered, and Try it is explicitly deferred to P13 |
| Exercises and samples | Inspect five exercise layouts, learner command/reporting contract, problem/solution wiring, shared track and store-layer conformance task; compare the four lesson procedures | No source-level mismatch found in the learner flow. Existing problem/solution verification is not evidence a fresh learner can solve the task; coordinator's cold walkthrough remains necessary |
| Docs rendering and navigation | Read reference/link/catalog mapping, glossary anchors, Claims generation/tests, guide status/sidebar generation, repo page routing and preview component; inspect actual built Claims output | DOC-01 and DOC-C01. Production browser QA is coordinator-owned |
| First-party library docs | Read datom and four store READMEs and compare links, stores, conformance ownership and platform limitations | No additional finding. Node/PGlite versus native/wasm qualification boundaries are stated clearly |
| Agent procedure docs | Read the three docs/agents files and issue conventions; compare canonical glossary/ADR rules and issue tracker behavior | No additional finding. GitHub Issues are explicitly not the tracker; publishing is outside this audit |
| Issue tracker | Inventory titles/status/What across all 99 numbered issues; detailed reads of relevant open docs, qualification and build issues | Existing gaps linked below were kept separate from new findings. Historical What text in a resolved issue is not by itself a current defect |
| Qualification evidence | Read evidence index, closure orientation and guide citations; inspect ledger semantics and the distinction between retained records and current fingerprint validity | Ledger freshness and fresh gate outcomes deferred to coordinator. Neither a dated note nor an ADR badge alone was treated as a fresh pass |
| Research and external references | Read index/conventions and selected review precedents needed to interpret decisions | 52 dated research files treated as historical context; not independently re-researched. `repos/`, vendor dependencies and sibling repositories are reference material, not first-party audit targets |

## Known planned gaps and uncertainty

- I71: append/revocation and accept-read races are already reproduced and intentionally tracked. The existing integration test pins the race and a known-bug invariant. Do not present that passing known-bug test as proof the race is closed.
- I69 and ADR-0035: accept does not yet enforce every rule. I66 owns typed attribute Schemas. I81 owns conflicts decided at accept. Those accepted designs are ahead of implementation.
- I80 and ADR-0036: journal-head fencing is accepted intent awaiting implementation; today's lease fence remains the current qualified mechanism.
- I84 and I85: generalized access and hash-chain work are planned, not implemented current capabilities.
- Presenter, origin trust, crypto-shredding, generators, native app-shell routing, and browser engine leadership contain named slots or planned gates. Their absence is recorded as delivery scope, not inferred broken behavior.
- P07's notification-tap fallback does not prove notification wake. This is already recorded in the harness README and existing issue history.
- P03's physical-device path is documented but not a freshly measured physical-device leg; its broad claim should not be used to imply the latter.

- I2: human acceptance of the draft log-store guide; an agent audit cannot supply that acceptance.
- I21: testing the glossary with a reader outside software. An agent learner is a different audience and cannot replace it.
- I22: overlapping claims/evidence navigation, distinct from DOC-01's missing content.
- I73: potentially poor search indexing of table text; needs production search reproduction.
- I97: ordinary page links do not yet have preview cards.
- I98: diagram labels and owned identifiers are not yet checked like prose.
- I99: old code identifiers after the vocabulary decisions; explicitly queued work.
- I13/P12/P13: DOM-only IntentComposer, real-platform story coverage and executable deep links are planned work. The log-store Try it placeholder says so.
- I66/I69/I80/I81/I84/I85: typed values, acceptance rules, journal fencing, convergent conflicts, access contract and tamper-evidence are decided but not fully built. Do not award their intended behavior to the present implementation.

Reference preview source gives the card pointer-events:none and hides it when the link loses hover. A visible card and those computed styles were observed; a real pointer transfer into its text was not completed. This stays an interaction concern requiring reproduction, not an additional confirmed accessibility violation. Keyboard focus and Escape handling exist in the source. Search quality and a full keyboard/screen-reader audit were not exhaustively established by this review.

Worktrees isolate files, not global devices and ports. The review used its own docs port and Chrome session and serialized the qualification harness; future parallel native/lab sessions still need coordination. No production deployment, scale-out claim, physical-device measurement, or upstream dependency audit is inferred from this run.

## Recommended next actions

1. Repair the journal codec collision with an explicit persisted-identity compatibility decision and workflow-level regression checks.
2. Tighten evidence truthfulness: reject all-skipped evidence, separate actual notification completion from fallback completion, and derive emitted metadata from running versions.
3. Restore the Claims proof criteria and update the current onboarding pointers. Correct the two smaller guide/process inaccuracies in the same documentation maintenance pass.
4. Define protocol-compatible collector rejection outcomes; do not blindly retry OTLP partial success.
5. Before adopting the relevant capabilities in apps, qualify compaction with rebuilding and interaction-session teardown. Consider requiring each suite/implementation pair explicitly.
6. Continue the already scheduled correctness/security work and the integrated exemplar; then gather real learner and consumer-reuse evidence. Preserve human guide acceptance as a separate decision.

## Evidence locations and reproduction inventory

Bulky and raw evidence stays outside Git under `.artifacts/`. It is local to this worktree and may not exist in another clone. Reports and sources above pin the reviewed commit so later updates to main cannot silently change the assessment.

- `.artifacts/repo-review/context.json` and `projects.json`: baseline and 28-project inventory.
- `.artifacts/repo-review/verify-all.log`, `ledger-before.txt`, `ledger-after.txt`: exact command outcomes.
- `.artifacts/qualification/2026-10-29T13-30-43.662Z-52020441/results.json` and per-gate logs: sequential input/freshness evidence; detailed device reports live in each gate's artifact directory.
- `.artifacts/repo-review/code/activity-name-collision.ts`, `compaction-rebuild.ts`, `otlp-partial-rejection.ts`, `skipped-evidence.ts`, `composer-lifetime.ts`, and adjacent logs: narrow public-contract measurements. The loopback collector used an ephemeral port and was closed afterward.
- `.artifacts/repo-review/skip-vitest-report.json`, `repro-real-skipped-stories.ts`, and `.txt`: real producer-status corroboration.
- `.artifacts/repo-review/claims-browser.txt`, `claims-p04.png`, `guide-browser-checks.json`, and layout screenshots: production browser evidence.
- `.artifacts/repo-review/learner/`: read sequence, five initial/final exercise logs, transfer answer, and problem-edits.patch. The original disposable checkout is `/private/tmp/viviefs-review-learner-2026-10-29`.
- `.artifacts/repo-review/code-review.md`, `docs-review.md`, and `goals-review.md`: independent lane records prior to reconciliation.

The concurrent-mint hypothesis was tested on real SQLite and PGlite and did not reproduce: twenty parallel mints were unique and monotonic. It is not a finding. OTLP severity was narrowed after checking the official partial-success semantics. Planned work was not counted as an implementation regression.

## Report validation

The applicable docs checks passed: docs build/link validation, diagrams, guides, references, glossary, retired words, and research index. The first report build caught nine incorrect new finding anchors; those links were corrected and the docs build passed on rerun. The HTML findings are cross-checked against the authoritative Markdown IDs/headings, and its twelve-concept table is derived from that report. Review-page filtering and 390px containment were exercised in the production browser. No gate or baseline was weakened. Only the two review records, their research-index rows, and the machine-generated qualification ledger differ in the review worktree; the separate learner checkout contains the five allowed problem-file edits.


## Follow-up - 2026-10-29

After the review was completed, the human requested committing these results with two separate follow-up issues:

- [I100 Address the repo-wide review findings](../issues/0100-address-the-repo-wide-review-findings.md) accounts for all nine findings and three design concerns, including existing issue ownership and the validation needed for each outcome.
- [I101 A reusable review path](../issues/0101-a-reusable-review-path.md) preserves the approach comparison and lessons from this session, and the decisions needed to give review a defined place alongside the existing verification, qualification and learning process.

The assessment and qualification run remain pinned to the original reviewed commit. Main subsequently gained the docs deployment work; follow-up repairs must recheck findings against their current baseline. Creating the issues and committing the record does not resolve a finding, amend an ADR, accept a guide or establish a new qualification claim.
