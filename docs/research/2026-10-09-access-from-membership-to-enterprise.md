# Access from membership to enterprise

Research record, 2026-10-09, for [I70](../issues/0070-research-access-from-membership-to-enterprise.md). Discussion material for the grilling of [I54](../issues/0054-trust-encryption-and-who-may-sign-in.md), not an ADR, a decision or qualification evidence. External sources were read on this date (links and sections under Sources). The code description is from `libs/sync/server/src/server.ts` and `libs/identity/src/oidc.ts` at `29680badb`. Nothing was built or run.

Each section separates **Fact** (what a cited source says, or what the code does) from **Inference** (what this record concludes for ViViEfs). Where an inference corrects the sketch in [ADR-0035](../adr/0035-accepting-a-change.md) ("A direction, not a decision") or the [contracts review page](2026-10-08-contracts-review.html) ("Setting the stage" and "Round 4"), it says so.

## The question

Can access in ViViEfs be one pattern whose reference implementation is today's code (organization membership, attributes only the server may write, and a registered command's declared writes) and whose later implementations grow to enterprise level (roles, relations stored as datoms in the style of Zanzibar, Cedar policies) under one contract, asked by the server's accept (what may be written) and by sync's filter (what a replica receives)? What is the smallest contract Cedar still fits? The five questions are in [I70](../issues/0070-research-access-from-membership-to-enterprise.md).

## Short answer

Yes, with three corrections to the sketch.

1. **The request fits, one resource at a time.** AuthZEN's evaluation and Cedar's request both name exactly one subject, one action, one resource and a context. A changeset that touches several entities is a batch of evaluations, one per touched entity, combined with AND (AuthZEN's `deny_on_first_deny`), not one request whose resource is "the entities the changeset touches" as Round 4 sketched. Sync's filter is one evaluation per organization today, and a search or a batch over candidates once sync is partial.
2. **A decision is only meaningful as of a position.** None of AuthZEN, Cedar or OPA carries a consistency position in the request; Zanzibar, SpiceDB (and, as future work, OpenFGA) do. The contract has to say which state the decision read. Today the server's sequence (the cursor) is that position, and it already plays the role of Zanzibar's zookie. Away from a single authority a single `tx` cannot play it, as the review page suggested: a `node` that has seen `tx` T cannot know it holds every datom with a smaller `tx`. A frontier (per-writer progress, [D105](../plan/bootstrap/02-decision-log.md#d105) (4)) can.
3. **Failure must be closed by the contract, not by the engine.** Cedar skips a policy whose evaluation errors, so an erroring `forbid` stops guarding; AuthZEN's batch defaults to `false` on error. The contract should say "an evaluation error is a deny" and every implementation's adapter should enforce it.

The smallest contract Cedar still fits (inference):

```ts
// One question, asked by accept (writes) and by sync (what a replica receives).
decide(
  evaluations: NonEmptyArray<{
    subject: { type: string; id: string }   // the caller: a person, later an agent
    action: { name: string }                // the registered command, or a read action
    resource: { type: string; id: string }  // one entity (or the organization, for sync)
    context: Record<string, Json>           // organization, device, origin, the writes
  }>,
  at: Position,                             // the read model state the decision reads
): Allow | Deny<{ index: number; reasons: ReadonlyArray<ReasonTag> }>
// AND over the evaluations; any evaluation error is a Deny.
```

Entities (who holds which role, who authored an item, which relation tuples exist) are not in the request: each implementation reads them from the read model at `at`. Cedar's level validation bounds what it must read, so the slice can be built from the read model. Search ("what may this person read?") is not in the smallest contract, because Cedar has no native search and its partial evaluation is an experimental feature. It can be an optional capability, as AuthZEN makes it. The reference implementation already answers this contract: membership, `authority: 'server'` and declared writes need nothing beyond it.

Not decided here: whether to do it, the reason vocabulary, which state a write check reads, and the triggers. Those are [I54](../issues/0054-trust-encryption-and-who-may-sign-in.md)'s (see "Questions for I54").

## Today's code, as the reference implementation

**Fact** (code at `29680badb`):

- **Who the caller is.** Bearer authentication verifies the token, finds the person through the account entity, and provides a `Caller` of `{ person, account, roles }`. The roles are the identity provider's realm roles: the OIDC verifier reads Keycloak's `realm_access.roles` and other providers give none (`libs/identity/src/oidc.ts`). They are carried, not enforced, and not scoped to an organization.
- **Membership first.** `Append`, `Pull`, `PutBlob` and `CompleteDeferred` all call `requireMembership(org)` first: the person's latest `viviefs/membership/granted` datom on `O{org}/M{person}`, in log order, must be an assert. A non-member gets `MembershipMissing` and learns nothing else. `Memberships.grant` and `revoke` are the operator's commands, serialized by their own semaphore, and write server-envelope changesets.
- **Accept.** Then `accept` checks that the envelope's actor is the caller (`ActorMismatch`), the manifest, that no datom writes an attribute whose catalog spec says `authority: 'server'` (`ServerOnlyAttribute`), that every entity is under `O{org}/` (`OrgMismatch`), that every attribute is in the catalog, that files exist, lease fencing for the workflow journal, and write-once rules. Then it appends in one SQL transaction.
- **Declared writes are decided, not built.** [D127](../plan/bootstrap/02-decision-log.md#d127) decides registered commands with declared writes; [I69](../issues/0069-accept-checks-every-change.md) builds them. Today the envelope names a command and accept does not check it.
- **Sync's filter.** `Pull` checks membership, then sends one page from the cursor: every changeset with at least one datom under `O{org}/`, whole. The read decision is "member of this organization", and the unit sent is a changeset.

**Inference.** In the contract's terms the reference has four rules: a non-member is denied every action; any action writing a server-only attribute from a device is denied; a write outside the command's declared writes is denied (once built); a member may read the whole organization. The actor check is authentication (the request is bound to the caller), not an access rule. [D124](../plan/bootstrap/02-decision-log.md#d124)'s row lists membership among "the structural checks accept runs today", while [ADR-0035](../adr/0035-accepting-a-change.md)'s table puts it under "may this writer do this?". It belongs to the second.

## 1. The request

**Fact** (AuthZEN, [Authorization API 1.0](https://openid.net/specs/authorization-api-1_0.html), Final; the document is dated 11 January 2026 and the OpenID Foundation [announced its approval](https://openid.net/authorization-api-1-0-final-specification-approved/) on 12 January 2026):

- The API is served by a Policy Decision Point (PDP) and called by a Policy Enforcement Point (PEP). "The policy language, architecture, and state management aspects of a PDP are beyond the scope of this specification" (§2).
- An Access Evaluation request has a REQUIRED `subject` (`type`, `id`, optional `properties`), `action` (`name`, optional `properties`), `resource` (`type`, `id`, optional `properties`) and an OPTIONAL `context` (§5, §6.1). The response is a Decision: a REQUIRED boolean `decision` and an OPTIONAL `context` for reasons, advice or step-up hints (§5.5). `false` "MUST NOT be permitted to go forward" (§5.5).
- "Many authorization systems are stateless, and expect the PEP to pass in all relevant attributes", hence `properties` (§5.1.1). "The architecture of this model assumes the PDP must trust the PEP" (§11.4).
- The Access Evaluations API (§7) boxcars several evaluations in an `evaluations` array. Top-level `subject`, `action`, `resource` and `context` are defaults that each evaluation may override (§7.1.1). The evaluations "are independent from each other, and may be executed sequentially or in parallel" (§7.1). `options.evaluations_semantic` is `execute_all` (the default), `deny_on_first_deny` (works "like the && operator") or `permit_on_first_permit` (§7.1.2.1). The response lists decisions in request order (§7.2). With `deny_on_first_deny` the example response stops at the first denial, so it is shorter than the request. Per-evaluation errors are payload-level: "Decisions default to closed (i.e. false)" (§7.2.1).
- The Search APIs (§8) return the subjects, resources or actions that would be permitted: "Which documents can Alice view?", "Who can view document 123?". A search SHOULD be transitive (§8.1). Pagination uses opaque tokens and "does not guarantee an atomic snapshot of the result set" (§8.2). A search result used in an evaluation SHOULD give `true`, but "this outcome is not guaranteed" (§8.1).
- The specification has no consistency or snapshot field for evaluations; the words consistency and snapshot appear only about pagination.

**Inference: accept.** A changeset is one action (its registered command) by one subject on several resources. Accept as the PEP asks one Access Evaluations request: top-level `subject` (the caller), `action` (the command name) and `context` (organization, device, origin), and one evaluation per touched entity whose `resource` is the entity's type and id, with `deny_on_first_deny`. Each evaluation's context can name the attributes written on that entity, which is what declared writes need. For example (attribute names illustrative):

```json
{
  "subject": { "type": "person", "id": "P42" },
  "action": { "name": "evidence.approveItem" },
  "context": { "organization": "O1", "device": "D3", "at": { "cursor": 1207 } },
  "options": { "evaluations_semantic": "deny_on_first_deny" },
  "evaluations": [
    { "resource": { "type": "item", "id": "O1/L1/I7" },
      "context": { "organization": "O1", "writes": ["evidence/item-approved-by"] } },
    { "resource": { "type": "list", "id": "O1/L1" },
      "context": { "organization": "O1", "writes": ["evidence/list-updated"] } }
  ]
}
```

Because evaluations are independent, a rule that needs two entities at once ("an item may move only between lists the writer edits", "the approver is not the author" when the same changeset sets the author) has to read the other entity from the read model, or carry it in context. The alternative, one evaluation whose resource is the changeset (`{ "type": "changeset", "id": cs }`), fits the schema but loses per-entity policies, which are the whole point of relations and Cedar. Note the per-evaluation override above repeats `organization`. Whether an evaluation's `context` replaces the default or merges with it is not spelled out, so a ViViEfs profile should say which.

**Inference: sync's filter.** With whole-organization sync, the read decision is one evaluation (`subject` person, an action such as `sync.pull`, `resource` the organization). When sync becomes partial ([I12](../issues/0012-partial-sync-and-history.md), [D114](../plan/bootstrap/02-decision-log.md#d114)), "what may this replica receive?" is the Resource Search API, OpenFGA's ListObjects or SpiceDB's LookupResources. Two misfits show up. AuthZEN search has no snapshot, so the result must be pinned to a log position through `context`. And the unit sync sends is a changeset, which must become visible whole (glossary, "Changeset"). A changeset touching an entity the reader may see and one it may not cannot be sent whole or split without breaking either confidentiality or atomicity. Strict-composition prefixes (`O{org}/L{list}/...`, [D38](../plan/bootstrap/02-decision-log.md#d38)) suggest one way out: a read scope is a subtree, and accept refuses a changeset that spans read scopes. That is a decision for I54 and [I12](../issues/0012-partial-sync-and-history.md), not a finding.

**Inference: the reply.** AuthZEN's boolean plus `context` carries ViViEfs's typed rejection as a reason in `context` (today's `Rejection` tags: `MembershipMissing`, `ServerOnlyAttribute`, later an unknown command or a write outside the declared set). The contract's `Deny` needs the failing evaluation's index and a reason vocabulary that every implementation maps to.

## 2. What each system separates

**Fact.**

| System | What it keeps apart | Combination rule |
| --- | --- | --- |
| AWS IAM ([policy types](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html), [evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html)) | Nine policy types: identity-based, resource-based, VPC endpoint, permissions boundaries, Organizations SCPs and RCPs, ACLs, RAM shares, session policies. Grants (identity-based, resource-based) are kept apart from limits that never grant: a permissions boundary "defines the maximum permissions that the identity-based policies can grant ... but does not grant permissions"; SCPs "do not grant permissions" and set "a permission guardrail"; a session's permissions are "the intersection" of its identity policies and the session policy | Implicit deny by default; any explicit `Deny` in any applicable policy is final; then RCPs, SCPs, resource-based, identity-based, boundary and session policy must each allow in turn. Identity and resource policies combine as a union within an account; guardrails intersect ([overview](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)) |
| AWS Config ([rules](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config-rules.html)) | Evaluation of resources already deployed, apart from the request path. Triggers on a configuration change, periodically, or both. Results: `COMPLIANT`, `NON_COMPLIANT`, `ERROR`, `NOT_APPLICABLE`. Two modes: detective (deployed resources) and proactive (before deployment) | "Proactive rules do not remediate resources that are flagged as NON_COMPLIANT or prevent them from being deployed" |
| Cedar ([authorization](https://docs.cedarpolicy.com/auth/authorization.html), [validation](https://docs.cedarpolicy.com/policies/validation.html), [patterns](https://docs.cedarpolicy.com/overview/patterns.html)) | Policies (`permit`, `forbid`, scope plus `when`/`unless`) apart from entity data (uid, attributes, parents, tags) apart from the schema. The authorizer, the validator and the analyzer are separate tools; "validation is an entirely separate API" from authorization | Default deny, forbid overrides permit, skip on error. Diagnostics name the determining policies and any erroring ones |
| Zanzibar ([paper](https://www.usenix.org/system/files/atc19-pang.pdf) §2) | Relation tuples `object#relation@user`, where a user may be a userset `object#relation` (data), apart from per-namespace relation configs with userset rewrites (`this`, `computed_userset`, `tuple_to_userset`, combined by union, intersection, exclusion), apart from the consistency model (zookies). APIs: read, write, watch, check, expand | A check walks the rewrites over the tuples at one snapshot no earlier than the zookie |
| OpenFGA ([language](https://openfga.dev/docs/configuration-language), [queries](https://openfga.dev/docs/interacting/relationship-queries)) | An authorization model (types, relations, `or`, `and`, `but not`, `X from Y`) apart from tuples, plus conditions on tuples and contextual tuples sent with one request ("not persisted"; "a limit of 100 contextual tuples per request", [contextual tuples](https://openfga.dev/docs/interacting/contextual-tuples)) | Check, BatchCheck, Expand, ListObjects, ListUsers. ListObjects returns what it finds within `listObjectsDeadline` (default 3s) up to `listObjectsMaxResults` (default 1000) |
| SpiceDB ([schema](https://authzed.com/docs/spicedb/concepts/schema), [caveats](https://authzed.com/docs/spicedb/concepts/caveats)) | `definition`s with `relation`s (stored) and `permission`s (computed with `+`, `&`, `-`, `->`), apart from relationships, apart from caveats (named CEL expressions on a relationship) | A check with a caveat whose context is missing returns `PERMISSIONSHIP_CONDITIONAL_PERMISSION` and the missing fields |
| OPA ([philosophy](https://www.openpolicyagent.org/docs/philosophy)) | Policy decoupled from the service. Base documents (`data`, loaded asynchronously) apart from `input` (pushed with the query) apart from virtual documents (what rules compute). "OPA itself is not tied to any particular domain model" | Whatever the Rego rules compute. The Cedar paper notes Rego "provides no built-in authorization concepts such as 'allow' or 'deny'" ([Cedar paper](https://arxiv.org/abs/2403.04651) §6) |

Zanzibar's scale machinery is described in the same paper: Spanner's TrueTime for external consistency (§2.2), aclservers fanning out checks, caching and request hedging, the Leopard index for deeply nested groups, and timestamp quantization (§3). The paper reports more than two trillion ACLs and millions of checks per second (§1).

**Inference: what exists only for AWS's (or Google's) scale.**

- **Scale only:** SCPs and RCPs (one guardrail over many accounts run by different teams), permissions boundaries (delegated administrators who create roles but must not escalate), resource-based policies, ACLs and RAM shares (cross-account principals), VPC endpoint policies (network paths), session policies (scoping temporary credentials), and every special case for cross-account and session principals in the evaluation page. ViViEfs has no cross-organization access: the organization is the isolation unit ([D18](../plan/bootstrap/02-decision-log.md#d18)). On Zanzibar's side, Spanner, Leopard, fan-out, caching and quantization are scale only.
- **What survives at ViViEfs's size:** default deny; an explicit deny that no grant can override; the split between what grants and what only limits; data (who relates to what) apart from rules (what a relation lets you do); detective evaluation apart from the request path; a decision that names its consistency position.
- **ViViEfs already has small forms of these.** Membership is a grant at organization level. `authority: 'server'` is a guardrail (a forbid for every device writer). Declared writes are a boundary in IAM's sense: they cap what a command may write and grant nothing, which is why they give an agent least privilege ([D127](../plan/bootstrap/02-decision-log.md#d127)). [D128](../plan/bootstrap/02-decision-log.md#d128) (rules over time) is AWS Config's detective evaluation. The device's early run of the same checks ([D124](../plan/bootstrap/02-decision-log.md#d124)) is Config's proactive mode: advisory, never the guard. D124's analogy (IAM preventive, Config detective) holds; Config's proactive mode adds that "early" never prevents.
- **The sketch's "common shape" claim needs a correction.** The review page says the four-part request "is the common shape of Cedar, OPA and OpenFGA checks". It is Cedar's (PARC) and AuthZEN's. OPA has no fixed request: `input` is any JSON. OpenFGA's check is user, relation, object (plus context and contextual tuples), so the action is a relation on a typed object, not a separate verb. A Zanzibar-style implementation maps the command to a relation per resource type.

## 3. Policy as data for analysis

**Fact.**

- Cedar's validator checks policies against a schema for unknown entity types, actions, attributes, misapplied `in` or `==`, unsafe optional attributes and type mismatches; "policies that pass validation don't result in runtime errors when they are run against schema-compliant entities and requests". The validator was formally modeled in Lean, with its correctness proved and differential testing against the Rust implementation ([Cedar security](https://docs.cedarpolicy.com/other/security.html)). A schema change can make validated policies error, and erroring policies are ignored ([validation](https://docs.cedarpolicy.com/policies/validation.html)).
- The Cedar paper ([OOPSLA 2024, extended version](https://arxiv.org/abs/2403.04651)) proves in Lean: forbid trumps permit, default deny, explicit allow, sound slicing and validation soundness (§3.5). It gives a symbolic compiler to a "decidable, sound, and complete" SMT encoding, used for equivalence and subsumption. The analysis returns a concrete counterexample (a request and an entity store) when two policy sets differ (§2.6, §4.4). Its example is a refactoring that silently removed access for interns. At the time of the paper, soundness and completeness of the encoding were "proved ... on paper", with the Lean proofs "underway" (§4.4).
- The current symbolic compiler, [`cedar-policy-symcc`](https://github.com/cedar-policy/cedar/tree/main/cedar-policy-symcc), verifies: a policy never errors, a policy set always allows, always denies, subsumption, equivalence and disjointness, each with a counterexample variant. It says it was "formally modeled and verified in Lean" and needs the cvc5 solver.
- Cedar evaluation terminates for bounded policies, and policies have no I/O and no effect on each other ([security](https://docs.cedarpolicy.com/other/security.html)). Level validation proves a policy reads entity data at most n dereferences from the request, so "level-based slicing" gives the same decision as all the data ([level validation](https://docs.cedarpolicy.com/policies/level-validation.html)).
- Zelkova ([Backes et al., FMCAD 2018](https://d1.awsstatic.com/Security/pdfs/Semantic_Based_Automated_Reasoning_for_AWS_Access_Policies_Using_SMT.pdf), abstract and §I) encodes AWS policies into SMT to answer "Is this resource accessible by a particular user?" and "Can an arbitrary user write to this resource?". It says syntactic checks are unsound. IAM Access Analyzer uses "logic-based reasoning" to find resources shared outside an account ([what is Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html)). Its custom policy checks are `CheckNoNewAccess`, `CheckAccessNotGranted` and `CheckNoPublicAccess` ([custom policy checks](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-custom-policy-checks.html)).
- The Cedar paper (§6, Table 2) says Zanzibar "provides no deep policy analysis now" and that Rego analysis "would be difficult, as Datalog program equivalence is undecidable".

**Inference: what Cedar's analysis proves that code cannot.** For code, a conformance table gives evidence on chosen rows, and types catch some mistakes, but whether two versions of an access function allow the same requests is undecidable in general. Cedar's analysis answers it for all requests and all entity stores that fit the schema:

- this release's policies allow nothing the last release denied ("no new access", Access Analyzer's `CheckNoNewAccess`);
- a refactoring changed nothing (equivalence);
- no policy can error, so skip on error never silently drops a `forbid` (never errors);
- a guardrail holds for every possible grant ("no agent ever grants membership": the set implies a deny for every agent request).

What it does not prove: anything about the data. "Who can approve item I7 today?" depends on who holds which role or relation, so it is a query over the read model (AuthZEN subject search, OpenFGA ListUsers, SpiceDB LookupSubjects), not a proof. The reference can answer it too, by reading its code and the read model.

**Inference: does an organization need the proof?** Not while the rules are code that ships with a release and is reviewed in git ([ADR-0035](../adr/0035-accepting-a-change.md) trade-offs). The proof starts to pay off when one of these holds: rules are written or reviewed by people who do not read the code (an auditor, a compliance owner); a regulated consumer app must show that a change grants no new access; enough `permit` and `forbid` rules interact that a reviewer cannot see their combination. If rules ship with the release, the proof fits ViViEfs's verify rather than a run-time feature. SymCC needs cvc5, so it would run in CI against the release's policy set, never on a device. "Policy as data" therefore does not require policies in the log, which [D118](../plan/bootstrap/02-decision-log.md#d118) and [ADR-0035](../adr/0035-accepting-a-change.md) reject for rules. A Cedar policy file in the release is data to the analyzer and code to the release process. Per-organization policies changed without a release would be the step that reopens D118 and [D129](../plan/bootstrap/02-decision-log.md#d129).

## 4. Offline and any `node`

### What runs where

**Fact.**

- [`@cedar-policy/cedar-wasm`](https://www.npmjs.com/package/@cedar-policy/cedar-wasm) 4.13.0 (latest, published 2026-09-15, Apache-2.0) ships `esm` (the default), `nodejs` and `web` builds with a 4.3 MB `.wasm` each. Its typings export `isAuthorized`, `statefulIsAuthorized` (cached schema and policy set), `isAuthorizedPartial` and `validate`. There is no batch call. The crate is built with the `partial-eval` feature (`cedar-wasm/Cargo.toml`), which the `cedar-policy` crate lists under "Experimental features" ([Cargo.toml](https://github.com/cedar-policy/cedar/blob/main/cedar-policy/Cargo.toml)). The README covers Node and webpack loading; it does not mention React Native.
- Hermes' [language features page](https://github.com/facebook/hermes/blob/main/doc/Features.md) does not list WebAssembly. In [facebook/hermes#395](https://github.com/facebook/hermes/issues/395) a maintainer wrote that Wasm support "is something that I would really like to do ... But we don't have a strong use case for it currently". The React Native release posts for 0.77 to 0.87 on [reactnative.dev/blog](https://reactnative.dev/blog) do not mention WebAssembly. No primary source found says Hermes exposes a `WebAssembly` global. A secondary source claims React Native 0.84 added WebAssembly; its own release post does not say so.
- OPA compiles Rego to a Wasm module per entrypoint; "built-in functions that are not natively supported can be implemented in the host environment (e.g., JavaScript)" ([OPA Wasm](https://www.openpolicyagent.org/docs/wasm)).
- OpenFGA's official npm packages are a client SDK (`@openfga/sdk`), a DSL transformer and frontend utilities ([npm registry search](https://www.npmjs.com/search?q=openfga)); the evaluator is the Go server. Third-party TypeScript evaluators exist and were not evaluated here. SpiceDB is a Go server.

**Inference.**

| Implementation | Web device | iOS and Android device (Hermes) | Server and other `node`s |
| --- | --- | --- | --- |
| Code (reference) | yes, in-process TypeScript | yes | yes |
| Roles (code plus role datoms) | yes | yes | yes |
| Relations as datoms | our own evaluator over the read model (userset rewrites in TypeScript); OpenFGA and SpiceDB servers do not run on a device | same | same, or an OpenFGA or SpiceDB server fed from the log |
| Cedar policies | `cedar-wasm` (packaging says so; not run here) | unverified: needs a probe; fallbacks are a native module around the Rust crate or the check on authority only | `cedar-wasm` on Node |
| OPA (not proposed) | Wasm | same caveat as Cedar | yes |

[D105](../plan/bootstrap/02-decision-log.md#d105) (2) needs the check to be runnable on any `node` that may hold authority, and [D124](../plan/bootstrap/02-decision-log.md#d124) wants it early on the device for feedback. "Cedar has a WebAssembly build" (Round 4) covers web and Node, not yet the phones. Whole-organization sync means a device holds every entity an organization-scoped policy could read, so an offline device can run the same decision; with level-validated policies the slice is bounded. Partial sync weakens this: a device may lack the entities a policy reads, and its early check can only say "unknown". SpiceDB's conditional result is a precedent for that third answer.

### What replaces the consistency token

**Fact.**

- Zanzibar ([paper](https://www.usenix.org/system/files/atc19-pang.pdf) §2.2, §2.4.4) defines the new enemy problem with two examples: neglecting the order of two ACL updates, and applying an old ACL to new content. Its fix has two parts. External consistency (TrueTime timestamps that respect causality, including causality "coordinated via channels invisible to Zanzibar"). And the zookie: a content-change check is evaluated at the latest snapshot, its zookie is stored with the content, and later checks are evaluated "at a consistent snapshot no earlier than the given zookie". "The content-change check does not need to be evaluated in the same transaction as the application content modification."
- SpiceDB's ZedToken is "the SpiceDB equivalent of Google Zanzibar's Zookie", with four levels: `minimize_latency`, `at_least_as_fresh`, `at_exact_snapshot`, `fully_consistent` ([consistency](https://authzed.com/docs/spicedb/concepts/consistency)). The page says to store a ZedToken with the content when the resource or its access changes.
- OpenFGA has `MINIMIZE_LATENCY` and `HIGHER_CONSISTENCY` and says of zookies: "OpenFGA is considering a similar feature in future releases" ([consistency](https://openfga.dev/docs/interacting/consistency)).
- AuthZEN 1.0 has no consistency field (section 1 above).
- ViViEfs: `tx` is a hybrid logical clock `(pt, c)` with a device fingerprint. Receive sets `last = max(last, received)`. `pt` is corrected against the `node` holding the duty to order changes, which refuses a `tx` too far ahead ([ADR-0007](../adr/0007-hybrid-logical-clock.md), [D119](../plan/bootstrap/02-decision-log.md#d119)). The cursor is "the server sequence position a replica has confirmed" (glossary, "Cursor").

**Inference, case by case.**

1. **Today (one authority, one log).** Membership and content share one log and one sequence. Accept is Zanzibar's content-change check: it reads the latest state. `Pull` re-checks membership at the latest state before every page. So the read-side new enemy problem does not arise, as the review page says. Two qualifications. The membership check and the append are not one transaction, and `grant` and `revoke` are serialized only among themselves, so an `Append` racing a `revoke` can be accepted with a sequence after the revocation. Zanzibar accepts the same window for its content-change check. It was read from the code, not reproduced. And a revoked device keeps what it already received ([communication architecture record](2026-09-30-communication-architecture.md) §5).
2. **The device's early check.** It reads its replica as of its cursor plus its outbox. A stale answer is harmless because authority decides again ([D124](../plan/bootstrap/02-decision-log.md#d124): enforcement follows trust). The position to record is the cursor.
3. **Authority moves to another `node`, one holder at a time ([I60](../issues/0060-server-independent-mode.md) hypothesis 1).** There is still one total order, so the position is the holder's sequence, qualified by a holder epoch so that sequences from two holders never compare as one (the same idea as lease fencing).
4. **Several `node`s accept or forward (peer exchange, shared authority).** A single `tx` is not a usable token. The HLC orders what a `node` has observed, but a `node` that has seen `tx` T cannot know it holds every datom with a smaller `tx`: an offline writer can deliver one later. So "check as of at least this `tx`" cannot be verified locally. What can be checked is a frontier: for each writer (device fingerprint), the highest `tx` received without gaps, which is catch-up by each writer's progress ([D105](../plan/bootstrap/02-decision-log.md#d105) (4)). The zookie's role is played by the writer's frontier at the time it wrote, stored with the changeset (in the envelope or signed with it, [I15](../issues/0015-identity-keys-and-trust.md)). A `node` may decide on content only once its applied frontier dominates the content's. That carries every revocation the writer had seen, which is Zanzibar's Example B. Two things it cannot give: causality through channels outside the system, which Zanzibar gets from TrueTime and an offline phone cannot, and a revocation concurrent with the write. Those need a rule from I60 (reject, quarantine, or accept until authority confirms), as the communication architecture record already notes.
5. **Accepted history forwarded by peers.** The position is the accepting authority's sequence, carried in an acceptance receipt.

So the contract's `at` is a cursor today and could become (holder epoch, sequence) or a frontier without changing the request. That is the reason to put it in the contract now.

## 5. The ladder

**Fact.** Cedar's [design patterns](https://docs.cedarpolicy.com/overview/patterns.html) name three: membership permissions ("Group membership is stored and managed independently of the policies, for example in an Identity Provider"), relationship permissions ("a relationship is modeled using an attribute on the resource", for example `principal in resource.owners`), and discretionary permissions, created at run time as template-linked policies ([templates](https://docs.cedarpolicy.com/policies/templates.html)). OpenFGA's [search guide](https://openfga.dev/docs/interacting/search-with-permissions) gives three ways to filter by permission: search then batch check, a local index built from the changes endpoint, or ListObjects then search. It recommends the local index when a user may access many objects. Cedar's paper encodes two OpenFGA models in validated Cedar (§5).

**Inference: the steps.**

| Step | Data | What decides | Answers search? | Trigger to move up to it |
| --- | --- | --- | --- | --- |
| 1. Code (reference, today) | `viviefs/membership/granted`; catalog `authority: 'server'`; declared writes per registered command (I69) | TypeScript in accept and in the command on the device | yes, trivially: the organization | (start) |
| 2. Roles | role datoms per person per organization, beside membership ([I16](../issues/0016-roles-and-self-service-membership.md)); each command names the roles that may run it | the same code | "who holds role R in O1" is a read-model query | the first consumer app with two kinds of member who may run different commands ([I16](../issues/0016-roles-and-self-service-membership.md)'s "Decide when"); not the IdP's realm roles, which are not per organization |
| 3. Relations as datoms (Zanzibar style) | tuples as datoms, e.g. `O1/L1` has relation `editor` to `person:P42` or to `O1/G3#member`; rewrites declared beside the catalog | an evaluator over the read model (own code) or an OpenFGA/SpiceDB server fed from the log | via a local index, OpenFGA's option 2 | access differs per entity (share this list with that person), nested groups, or a replica must receive only what its reader may see ([I12](../issues/0012-partial-sync-and-history.md)'s trigger "roles restrict data within an organization") |
| 4. Policies (Cedar) | the same datoms, presented as Cedar entities (attributes and parents) by a slicer; policies shipped with the release | `cedar-wasm` or the Rust crate | not natively (partial evaluation is experimental); candidates then batch | conditions over attributes and context (amount, time, origin trust, device), guardrail `forbid`s that must hold whatever is granted, rules owned or audited apart from code, or a proof (section 3) |

Steps are additive: membership and declared writes stay as guardrails at every step.

**Inference: the conformance decision table.** One table of rows, each a small log (datoms at a position), one request and the expected decision with its reason tag. Each implementation declares the steps it covers and must reproduce every row of those steps and every row below them. Sketch:

| # | Datoms at `at` | Request (subject, action, resource, context) | Expected | Step |
| --- | --- | --- | --- | --- |
| 1 | no membership for `P42` in O1 | `P42`, `evidence.renameList`, list `O1/L1` | Deny `MembershipMissing` | 1 |
| 2 | membership asserted, then retracted | `P42`, any, `O1/L1` | Deny `MembershipMissing` | 1 |
| 3 | membership asserted | `P42`, `evidence.renameList`, `O1/L1`, writes `[evidence/list-title]` | Allow | 1 |
| 4 | membership asserted | `P42`, any command, writes a server-only attribute | Deny `ServerOnlyAttribute` | 1 |
| 5 | membership asserted | `P42`, `evidence.renameList`, writes an attribute outside its declared writes | Deny (write outside declared set) | 1 |
| 6 | membership asserted | `P42`, an unregistered command | Deny (unknown command) | 1 |
| 7 | membership asserted | `P42`, `sync.pull`, organization O1 | Allow | 1 |
| 8 | `P42` member, no role `reviewer` | `P42`, `evidence.approveItem`, `O1/L1/I7` | Deny | 2 |
| 9 | `P42` member with role `reviewer` in O1 (not in O2) | `P42`, `evidence.approveItem`, `O2/L1/I7` | Deny | 2 |
| 10 | `P42` has relation `editor` on `O1/L1` | `P42`, `evidence.renameList`, `O1/L1` | Allow; on `O1/L2` Deny | 3 |
| 11 | `P42` is in group `O1/G3`, which has `viewer` on `O1/L1` | `P42`, read, `O1/L1` | Allow (transitive) | 3 |
| 12 | `P42` is reviewer and author of `O1/L1/I7` | `P42`, `evidence.approveItem`, `O1/L1/I7` | Deny (reviewer is the author) | 3 or 4 |
| 13 | caller is an agent with every role | agent, `membership.grant`, O1 | Deny (guardrail) | 4 |
| 14 | the same log, `at` before and after a revocation | `P42`, any | Allow before, Deny after | all |
| 15 | an implementation fails to evaluate (a policy errors, a tuple is missing) | any | Deny | all |

Rows 14 and 15 are what make the implementations interchangeable: they pin the position and the closed failure, the two places Cedar, AuthZEN and the reference differ by default. The same rows run on the device (the early check) and on authority.

**Inference: what triggers moving up, and what it costs.** Each step is triggered by a consumer app's need, never by size alone:

- Roles: a command some members may run and others may not.
- Relations: permission that differs per entity, or partial sync by permission.
- Policies: conditions and guardrails that become hard to read in code, an auditor, or the need for a proof.

The cost grows by step. Roles add datoms and a grant command. Relations add an evaluator and a local index. Policies add a Wasm or native engine on every `node` that decides, a slicer from the read model, and a CI analyzer. Because the request is the same, a step up changes the implementation behind `decide`, not accept or sync.

## Questions for I54

These are questions for the grilling, not answers.

1. Is access a pattern with a reference implementation and a conformance table ([D82](../plan/bootstrap/02-decision-log.md#d82), [D110](../plan/bootstrap/02-decision-log.md#d110)), and does its gate extend [P11](../plan/bootstrap/06-qualification-gates.md#p11), [P09](../plan/bootstrap/06-qualification-gates.md#p09), or get its own?
2. Is the request AuthZEN-shaped (subject, action, resource, context), and is a changeset a batch with AND semantics, one evaluation per touched entity? Or does a changeset-level resource also exist?
3. Does the contract carry a position (`at`)? Is it the cursor today, and is the frontier the planned replacement away from one authority ([I60](../issues/0060-server-independent-mode.md))?
4. Does an evaluation error deny, whatever the implementation (Cedar's skip on error)?
5. Which state does a write check read: the state before the changeset, the state after, or both (Cedar's entities plus the proposed values in context)? "The approver is not the author" depends on it.
6. Is membership an access decision (question 1 of [D124](../plan/bootstrap/02-decision-log.md#d124)) or a structural check (question 2)? D124's row and ADR-0035's table place it differently.
7. Are declared writes part of the access contract (IAM's boundary), or a structural check of the changesets pattern?
8. What is the reason vocabulary a `Deny` carries, and how does each implementation map to it (today's `Rejection` tags, Cedar's determining policy ids)?
9. Is search (what may this person read, who may approve) part of the contract or an optional capability? Who needs it first: sync's partial filter, or a screen?
10. For partial sync: what is a read scope, and may a changeset span two? Is the strict-composition subtree the read scope?
11. Are roles per organization (role datoms) rather than the IdP's realm roles, which the token carries today?
12. Are relations datoms in the organization's log, and are their rewrites code beside the catalog (like acceptance rules) or data?
13. Do Cedar policies ship with the release (analyzable in CI, [D118](../plan/bootstrap/02-decision-log.md#d118) intact), or may an organization change its own policies without a release (which reopens D118 and [D129](../plan/bootstrap/02-decision-log.md#d129))?
14. Must every implementation run on iOS and Android for the early check, or may a higher step run on authority only, with the device saying "unknown"? Does Cedar on Hermes need a probe before it can be an implementation?
15. Is "who can do X" a proof the stack owes (SymCC in verify), or a query an app builds when an auditor asks?
16. How are a revocation and a write that are concurrent in time handled when authority is shared? This is for I60, but the access contract must leave room for the answer.
17. Does the `Append` and `revoke` race window (section 4, case 1) need closing now, or is Zanzibar's tolerance of it the standard to keep?

## Sources

All read 2026-10-09.

- OpenID Foundation, [Authorization API 1.0](https://openid.net/specs/authorization-api-1_0.html), Final (dated 11 January 2026): §2 Model, §3 Features, §5 Information Model, §6 Access Evaluation API, §7 Access Evaluations API (§7.1.1 defaults, §7.1.2.1 semantics, §7.2.1 errors), §8 Search APIs (§8.1 semantics, §8.2 pagination), §11.4 Trust. [Approval announcement](https://openid.net/authorization-api-1-0-final-specification-approved/), 12 January 2026.
- Cedar documentation: [How Cedar authorization works](https://docs.cedarpolicy.com/auth/authorization.html) (request, algorithm, default deny, forbid overrides permit, skip on error); [Policy validation against schema](https://docs.cedarpolicy.com/policies/validation.html); [Policy level validation](https://docs.cedarpolicy.com/policies/level-validation.html) (level-based slicing); [Entities and context syntax](https://docs.cedarpolicy.com/auth/entities-syntax.html); [Design patterns](https://docs.cedarpolicy.com/overview/patterns.html) (membership, relationship, discretionary); [Templates](https://docs.cedarpolicy.com/policies/templates.html); [Security](https://docs.cedarpolicy.com/other/security.html) (Lean model, differential testing, termination).
- Cutler et al., [Cedar: A New Language for Expressive, Fast, Safe, and Analyzable Authorization (Extended Version)](https://arxiv.org/abs/2403.04651), Proc. ACM Program. Lang. 8, OOPSLA1 (2024): §2.6 analyzing policies, §3.3 authorization and slicing, §3.5 properties, §4.4 soundness and completeness, §5 evaluation, §6 related work and Table 2.
- [cedar-policy/cedar](https://github.com/cedar-policy/cedar): `README.md`, `cedar-policy/Cargo.toml` (experimental features), `cedar-wasm/Cargo.toml`, [`cedar-policy-symcc/README.md`](https://github.com/cedar-policy/cedar/tree/main/cedar-policy-symcc) (verified properties).
- [@cedar-policy/cedar-wasm](https://www.npmjs.com/package/@cedar-policy/cedar-wasm) 4.13.0: registry metadata, `README.md`, `nodejs/cedar_wasm.d.ts` (exports and types).
- Pang et al., [Zanzibar: Google's Consistent, Global Authorization System](https://www.usenix.org/system/files/atc19-pang.pdf), USENIX ATC 2019: §1, §2.1 relation tuples (Table 1), §2.2 consistency model (new enemy problem), §2.3.1 relation configs and userset rewrites (Figure 1), §2.4 API (read, write, watch, check, expand), §3 architecture (Leopard).
- OpenFGA documentation: [Configuration language](https://openfga.dev/docs/configuration-language); [Relationship queries](https://openfga.dev/docs/interacting/relationship-queries) (Check, Batch Check, ListObjects, ListUsers and their limits); [Query consistency modes](https://openfga.dev/docs/interacting/consistency); [Contextual tuples](https://openfga.dev/docs/interacting/contextual-tuples); [Conditions](https://openfga.dev/docs/modeling/conditions); [Search with permissions](https://openfga.dev/docs/interacting/search-with-permissions).
- SpiceDB documentation: [Consistency](https://authzed.com/docs/spicedb/concepts/consistency) (ZedTokens, levels); [Schema](https://authzed.com/docs/spicedb/concepts/schema); [Caveats](https://authzed.com/docs/spicedb/concepts/caveats).
- AWS IAM User Guide: [Policies and permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html) (policy types, permissions boundaries, session policies); [Policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html); [How AWS enforcement code logic evaluates requests](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html); [IAM Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html); [Custom policy checks](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-custom-policy-checks.html). AWS Organizations User Guide: [Service control policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html).
- Backes et al., [Semantic-based Automated Reasoning for AWS Access Policies using SMT](https://d1.awsstatic.com/Security/pdfs/Semantic_Based_Automated_Reasoning_for_AWS_Access_Policies_Using_SMT.pdf), FMCAD 2018: abstract, §I.
- AWS Config Developer Guide: [Evaluating resources with AWS Config rules](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config.html); [Components of an AWS Config rule](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config-rules.html) (evaluation results, trigger types, evaluation modes).
- Open Policy Agent: [Philosophy](https://www.openpolicyagent.org/docs/philosophy) (decoupling, document model); [WebAssembly](https://www.openpolicyagent.org/docs/wasm).
- Hermes: [Language features](https://github.com/facebook/hermes/blob/main/doc/Features.md); [facebook/hermes#395](https://github.com/facebook/hermes/issues/395). React Native: [blog](https://reactnative.dev/blog), release posts 0.77 to 0.87.
- ViViEfs: `libs/sync/server/src/server.ts` (`Memberships`, bearer authentication, `accept`, the handlers), `libs/identity/src/oidc.ts`, [ADR-0035](../adr/0035-accepting-a-change.md), [ADR-0007](../adr/0007-hybrid-logical-clock.md), [decision log](../plan/bootstrap/02-decision-log.md) (D105, D118, D119, D124-D129), [I60](../issues/0060-server-independent-mode.md), [I16](../issues/0016-roles-and-self-service-membership.md), [I12](../issues/0012-partial-sync-and-history.md), [I69](../issues/0069-accept-checks-every-change.md), the [contracts review page](2026-10-08-contracts-review.html) ("Setting the stage", "Round 4"), the [communication architecture record](2026-09-30-communication-architecture.md).
