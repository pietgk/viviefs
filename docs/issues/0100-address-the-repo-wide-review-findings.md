# I100: Address the repo-wide review findings

Status: needs-triage

Category: bug

Type: task

Found: 2026-10-29

## What

Address every finding and design concern in the 2026-10-29 repo-wide review, retaining the evidence and linking each outcome to its repair or explicit decision.

The [dated report](../research/2026-10-29-repo-wide-review.md) is the source of the findings; its [review board](../research/2026-10-29-repo-wide-review.html) is a view of that record. The report covers code quality, documentation quality, consistency and goal alignment at commit `2dbaf83f24b2a974497ecaf025051c82f6c19f2b`. It records nine findings and three separate design concerns. This issue accounts for their disposition; it does not accept every proposed remedy as a design decision.

Full verification passed with the declared web E2E skip. [P01 Platform on SDK 58][P01]-[P11 Identity][P11] passed in one sequential run on unchanged committed inputs, but the review reproduced a qualification overclaim and defects outside the checks' current coverage. A fresh agent solved all five log-store exercises without reading solutions; that is agent usability evidence, not human comprehension or guide acceptance.

Main has advanced since the reviewed commit. Before changing code, reproduce against the then-current main and check related work. A finding already corrected elsewhere closes with the fixing commit and evidence; the dated report remains a record of its original baseline.

## Findings to address

The stable IDs below belong to the report, not to the decision log. Reproduction steps, source locations, confidence, limitations and recommendations are in each linked section.

| Done | Report finding | Required outcome |
| --- | --- | --- |
| [ ] | [R01 Distinct activity names can skip work](../research/2026-10-29-repo-wide-review.md#r01-distinct-activity-names-can-skip-work) | Reproduce the two-activity collision through the public workflow contract. Decide persisted-ID compatibility before repairing the codec; prove roundtrip, injectivity and distinct activity execution. This takes priority because work is silently skipped. |
| [ ] | [R02 Skipped tests can satisfy the evidence gate](../research/2026-10-29-repo-wide-review.md#r02-skipped-tests-can-satisfy-the-evidence-gate) | Make entirely skipped stories and test-backed process entries fail their evidence treatment. Exercise real producer output and define any permitted partial skips explicitly. |
| [ ] | [R03 Every Claims section loses its proof criteria](../research/2026-10-29-repo-wide-review.md#r03-every-claims-section-loses-its-proof-criteria) | Restore every defined pass condition and positive control from the actual gate table, test its real anchored format, and confirm the production page. |
| [ ] | [R04 Notification qualification can bypass the tap](../research/2026-10-29-repo-wide-review.md#r04-notification-qualification-can-bypass-the-tap) | Resolve through [I14 Physical devices, and a notification tap that completes a durable deferred][I14] rather than creating a duplicate notification issue. Keep a diagnostic fallback distinct from a successful notification tap, and align the gate verdict with the journey actually observed. |
| [ ] | [R05 Collector rejection disappears from export results](../research/2026-10-29-repo-wide-review.md#r05-collector-rejection-disappears-from-export-results) | Expose rejected span counts and diagnostics, and distinguish backend acceptance from transport success. Follow OTLP's partial-success rule; do not blindly retry a partially accepted batch. |
| [ ] | [R06 Fresh qualification emits stale dependency versions](../research/2026-10-29-repo-wide-review.md#r06-fresh-qualification-emits-stale-dependency-versions) | Make the [P02 SQLite drivers][P02] claim and emitted [P08 UI three-way prototype][P08] metadata describe the actual resolved versions, including the [I23 effect-machine still requires the Effect release candidate][I23] update. Check a fresh output against its running manifests. |
| [ ] | [R07 Primary onboarding says no code exists](../research/2026-10-29-repo-wide-review.md#r07-primary-onboarding-says-no-code-exists) | Orient root and bootstrap entry documents to the current repository, with a current handover and usable first task; preserve historical context as history. |
| [ ] | [R08 Guide overstates database-independent SQL](../research/2026-10-29-repo-wide-review.md#r08-guide-overstates-database-independent-sql) | Correct the log-store guide's portability explanation against the real migration and compaction dialect branches. |
| [ ] | [R09 Canonical procedure names a missing gate-table path](../research/2026-10-29-repo-wide-review.md#r09-canonical-procedure-names-a-missing-gate-table-path) | Repair the source pointer in Verify - Qualify - Teach and distinguish a claim from a fact in that procedure. |

## Design concerns to resolve or explicitly defer

| Done | Report concern | Required disposition |
| --- | --- | --- |
| [ ] | [A01 Compaction and rebuild do not compose safely](../research/2026-10-29-repo-wide-review.md#a01-compaction-and-rebuild-do-not-compose-safely) | Decide and enforce the safe preconditions, snapshot/rehydration approach, or explicit unavailability before app use. No active production compaction caller was found; retain that limit. |
| [ ] | [A02 Interaction sessions have no owned shutdown](../research/2026-10-29-repo-wide-review.md#a02-interaction-sessions-have-no-owned-shutdown) | Establish an owned interaction lifetime and teardown evidence before copying the retained driver into the app shell. Keep accepted durable work's lifetime separate from the screen's. Coordinate with [I13 UI renders only in the DOM, never on a device][I13] and the app-shell work. |
| [ ] | [A03 Suite evidence is not tied to each implementation](../research/2026-10-29-repo-wide-review.md#a03-suite-evidence-is-not-tied-to-each-implementation) | Decide whether to require explicit suite/implementation attribution, with a hostile missing-implementation check. Current suites genuinely run both host stores; this is a guardrail limitation, not an observed conformance failure. |

## Working procedure and completion

- Start bug fixes with the closest end-user reproduction: workflow execution, CLI/evidence result, served docs, actual collector response or device journey as appropriate. Then keep a meaningful regression check at the public contract.
- Preserve the original evidence. Raw artifacts remain local and ignored; the committed report contains observations and enough reproduction detail to reconstruct a missing local artifact. Recreate measurements when needed rather than treating an absent log as proof.
- Record each item's action, fixing commit and validation here, or link a narrowly scoped child issue. Do not resolve this issue while any item has no disposition. A design deferral needs a reason, an owner issue and a concrete `Decide when:`.
- Ask before deviating from accepted intent and amend its owning ADR when required. R01's encoding compatibility and the design concerns need that judgment before implementation; this umbrella issue is therefore `needs-triage`.
- Run `pnpm verify` for each resulting change and the relevant qualification gates when their inputs or claims change. Never loosen a gate or rewrite the evidence baseline just to pass. A report cannot change a gate's status.
- Existing planned work, including [I66 Attribute value types and the typed reference read model][I66], [I69 Accept checks every change][I69], [I71 An append can land after a revocation][I71], [I80 Build the journal fence][I80], [I81 Build conflicts decided at accept][I81], [I84 Build the access pattern][I84] and [I85 Build the hash chain][I85], remains in its owning issues. Reuse those issues when a repair depends on them instead of duplicating their designs.

## Related work

[I101 A reusable review path][I101] captures the comparison and research for a reusable review path. Resolving these findings does not require waiting for that process design, and designing review does not require closing every finding first.

## Comments

2026-10-29: Created with the dated review results at the human's request. No repairs are claimed by creating this issue.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[I101]: 0101-a-reusable-review-path.md
[I13]: 0013-ui-on-every-platform.md
[I14]: 0014-physical-devices-and-notification-tap.md
[I23]: 0023-effect-machine-on-stable-effect.md
[I66]: 0066-attribute-value-types.md
[I69]: 0069-accept-checks-every-change.md
[I71]: 0071-an-append-can-land-after-a-revocation.md
[I80]: 0080-build-the-journal-fence.md
[I81]: 0081-build-conflicts-decided-at-accept.md
[I84]: 0084-build-the-access-pattern.md
[I85]: 0085-build-the-hash-chain.md
[P01]: ../plan/bootstrap/06-qualification-gates.md#p01
[P02]: ../plan/bootstrap/06-qualification-gates.md#p02
[P08]: ../plan/bootstrap/06-qualification-gates.md#p08
[P11]: ../plan/bootstrap/06-qualification-gates.md#p11
