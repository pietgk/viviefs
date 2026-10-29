# I101: A reusable review path

Status: ready-for-human

Category: enhancement

Type: grilling

Found: 2026-10-29

## What

Give review a defined place in ViViEfs and design a reusable path that can select one or more review approaches for a future session.

Verify, qualification and learning already have defined roles. The human's proposal after the [2026-10-29 repo-wide review](../research/2026-10-29-repo-wide-review.md) is that review also needs a place: a review may cover a diff, a part of the repo or the whole repo, and may examine code, docs, consistency, architecture or goal versus implementation. This issue preserves the approaches investigated at the beginning of that session so the next design session starts from the research rather than repeating it.

The [review board](../research/2026-10-29-repo-wide-review.html) is a view of the completed review. [I100 Address the repo-wide review findings][I100] owns addressing its findings. This issue owns the future review path; neither issue blocks the other.

## Current sources and constraint

- [Verify - Qualify - Teach](../plan/bootstrap/05-verify-qualify-teach.md), [ADR-0026 Verify - Qualify - Teach][ADR-0026] and the glossary distinguish checking contracts, establishing claims, and learning/guide acceptance. [D70 Verify versus qualify][D70] separates Verify and Qualify by what a check needs and produces, and the current ADR explicitly says there is no third mode.
- [ADR-0032 What ViViEfs is about and its foundation concepts][ADR-0032] defines app creation, the shared language, and the two verifications: gates for what was built, learning for the language. Review must be useful against those goals, not merely produce a style score.
- The guide template's [Review page](../../apps/docs/src/guide-template/review.mdx) separates tool-enforced rules from judgment and common mistakes. The existing [log-store Review page](../../apps/docs/src/content/docs/guides/log-store/review.mdx) shows that split concretely.
- Existing skill procedures and their limitations are summarized below. Locked skills remain byte-identical to upstream; any repo-specific path must use canonical repo documentation and thin procedures, as [D30 One source for humans and agents][D30] requires.

These sources do not yet settle where a reusable review path belongs. The working hypothesis is that review supplies reasoned judgment and feedback, using verification results, qualification evidence and learning observations as inputs. It does not replace those mechanisms, mark a gate passed, accept a guide or silently amend intent. If the chosen design changes the existing process, amend its owning ADR explicitly.

## Approaches investigated in the session

This is the comparison already made, based on the installed procedures and the repository's implementations on 2026-10-29. It is not a claim that every approach was independently executed.

| Approach and source | Useful question | Strengths | Limits and side effects |
| --- | --- | --- | --- |
| Existing verification, `tools/verify/src/stages.ts` | Do the encoded contracts and repository checks hold? | Repeatable types, lint, tests, evidence ownership, builds, docs structure, references, vocabulary and diagrams; already runs in CI. | Only establishes what the checks encode. Passing docs structure does not establish clarity, and a green command may include an explicit skip. Whole-repo local execution needs both `CI=true` and `pnpm verify all`. |
| [code-review skill](../../.agents/skills/code-review/SKILL.md) | Does a bounded change follow standards and its originating specification? | Independent Standards and Spec reviewers stop one axis masking the other; concrete missing requirements and scope deviations can be identified. | Diff-oriented. Its documented three-dot comparison excludes uncommitted edits and does not inspect the whole existing repo. Spec compliance does not establish that the spec serves the goal. |
| [Architecture review](../../.agents/skills/improve-codebase-architecture/SKILL.md) with [codebase-design](../../.agents/skills/codebase-design/SKILL.md) | Does the structure concentrate complexity and make change/test work understandable? | Examines coupling, scattered knowledge, shallow surfaces and testability, with concrete improvement candidates. | Focuses on architectural friction, often recent hot spots. It is not complete correctness, docs or outcome assurance; its normal procedure continues into a human design session. Generic heuristics must yield to repo decisions and vocabulary. |
| Documentation and consistency audit, using [domain-modeling](../../.agents/skills/domain-modeling/SKILL.md) and [writing-for-agents](../../.agents/skills/writing-for-agents/SKILL.md) as references | Are the explanations accurate, clear, navigable and consistent with code and decisions? | Cross-checks glossary, ADRs, guides, examples, code and rendered pages; can expose stale status, duplication and instructions a reader cannot use. | A composed review, not an installed dedicated docs-audit skill. Needs an explicit rubric. The referenced skills normally support editing; findings-first execution must prevent automatic model or docs changes. Human and agent readers need different evidence. |
| Goal-to-evidence review, followed by [grilling](../../.agents/skills/grilling/SKILL.md) for unsettled decisions | Does the implementation serve the intended outcome, and does the intent still make sense? | Traces goals through contracts, implementation, tests, evidence and learning. Separates compliance from reasoned challenges to accepted choices. | Also a composed review. Grilling produces decisions rather than implementation proof and needs human participation. Design concerns need concrete friction and alternatives, not speculative preference. |
| Qualification and an end-user walkthrough, `tools/qualification/README.md` | Do important claims survive the actual platform and failure conditions? | Real device/lab behavior, crash/resume, sync, identity and meaningful failure controls; retained evidence and fingerprints. | Requires a stable committed baseline and shared runtime resources. Qualification writes the ledger. A recorded pass can overstate its claim if the probe is flawed; it does not establish teaching quality. |
| `no-mistakes`, an installed user-level skill | Is a completed change validated and ready for delivery? | Orchestrates intent review, tests, docs, lint, fixes, push, PR and CI. | Committed-branch delivery pipeline, with broader mutation/publishing scope than an inspection. It is not a locked repo skill or a substitute for a whole-repo purpose/learning assessment. Starting it is not implicit in asking for a findings-only review. |
| [retro skill](../../.agents/skills/retro/SKILL.md) | What should change in the agent environment after a session? | Finds missing checks, weak instructions, navigation problems and recurring process failures grounded in observed work. | Session/process review, supplementary to product assessment. It cannot establish the correctness or usefulness of the whole product on its own. |

The `teach` skill is not a repo documentation-audit procedure: it uses a separate teaching workspace. Repo guides, lessons and exercises stay in the docs site. No new skill installation was needed for the completed review.

## What this review taught us about the path

- No one procedure covered code, docs, consistency and goal alignment. A useful review can combine selected approaches while reporting their conclusions separately.
- Distinguish three questions: does it follow the standards, does it implement the stated intent, and does that intent achieve the goal? A pass in one must not conceal a failure in another.
- Record the baseline commit, scope, exclusions, coverage depth, checked surfaces, fresh commands, skips and evidence age. Report confidence separately from impact.
- Keep defects, documentation contradictions, unsupported claims, known planned gaps and design concerns distinct. Recheck old findings against current main before fixing them.
- Reproduce important findings through public/end-user behavior. Challenge suspected defects against their actual contract and primary sources; the OTLP finding was narrowed because its protocol forbids blind retries of partial success.
- A fresh-context learner solved all five exercises without solutions, but that does not establish comprehension for a person outside software or human guide acceptance.
- Choose findings-first versus repair/delivery explicitly. The completed review preserved the source baseline and created separate disposable learner work.
- Independent reviewers can broaden perspectives; duplicate findings need reconciliation and disagreement must remain visible when evidence does not resolve it. One coordinator must own shared devices and labs.
- Show the user an inspectable result while long runtime checks proceed. The human had to ask whether results were available; a final-only presentation left progress less visible than it should have been.
- Durable records should contain enough observations and reproduction steps to remain useful after ignored local artifacts disappear. The HTML review view must derive from the Markdown record rather than become a second source of findings.

## Decisions for the next session

1. What is review's purpose and relationship to Verify - Qualify - Teach and learning? Is it a cross-cutting activity, a named process stage, a delivery requirement, or some combination? Decide this before changing canonical terminology or adding a mode.
2. How does a session select one or more approaches by its question and scope: diff, pattern/feature, subsystem, docs set, repo, or observed development session? Define required inputs and route to existing procedures where they fit.
3. Which dimensions remain independent, and which omissions must be explicit? Include standards, intent compliance, goal usefulness, architecture, docs/readability, consistency, evidence quality and learning where selected.
4. What is the minimum credible evidence for each selected approach? Specify when reading, host checks, rendered-page checks, devices/labs, public-contract reproductions or real learner observations are required, and how blockers limit conclusions.
5. What does a review produce, how is it stored and found, and how does it become actionable? Decide the report/coverage/finding shape, stable IDs, evidence links, issue linkage, deferral, re-review and closure. Keep a short route for a small change as well as a comprehensive repo review.
6. Which actions require an explicit session choice: independent reviewers, runtime operations, repairs, commits and publishing? Keep execution autonomy within the chosen scope; worktree isolation does not isolate ports or devices.
7. Which recurring judgment failures should become deterministic checks, and which must remain human/agent judgment? Avoid duplicating existing `verify` checks as manual rules.
8. Where are the canonical explanation and reusable procedure kept, and what ADR, glossary, guide or agent-map amendments are warranted? Do not change locked skills or create a second copy of canonical instructions.

## Expected outcome

A decision-complete design for a reusable review path with a clear purpose, selectable approaches, inputs, evidence requirements, outputs, completion criteria and follow-up lifecycle. Record accepted decisions in their owning canonical sources, and create focused build issues for any tool or thin procedure the decisions require. Use the completed repo review as one worked case and a small diff/docs-only review as another, so the path is not restricted to exhaustive audits.

The comparison and observations above are research inputs. They do not pre-approve a new process mode, prescribe a permanent reviewer team, or claim that green checks establish code, docs and goal quality by themselves.

## Comments

2026-10-29: The human asked to commit the review with a findings issue, then preserve the research in a separate issue so a more extensive review path can be picked up later. [I100 Address the repo-wide review findings][I100] owns the findings; this issue is ready for that design conversation.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0026]: ../adr/0026-verify-qualify-teach.md
[ADR-0032]: ../adr/0032-what-viviefs-is-about.md
[D30]: ../plan/bootstrap/02-decision-log.md#d30
[D70]: ../plan/bootstrap/02-decision-log.md#d70
[I100]: 0100-address-the-repo-wide-review-findings.md
