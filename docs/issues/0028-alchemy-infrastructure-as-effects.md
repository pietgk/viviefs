# I28: Alchemy: infrastructure as Effects

Status: needs-triage

Category: enhancement

Found: 2026-10-03

Decide when: together with I7, or earlier if a gate needs a cloud resource

## What

[Alchemy](https://alchemy.run/what-is-alchemy/) declares cloud resources and the code that runs on them in one Effect v4 program, and the plan did not take it into account: we need to decide if, why, when and how ViViEfs integrates it. It matches our concepts closely (an Alchemy `Layer` is our Layer), it overlaps with how AWS local development is done today and with our lab runtime, and many of its names clash with our glossary, so the glossary clean-up belongs with I26.

Alchemy's terms are written as code in this issue (`Stage`, `Worker`), because the docs site would otherwise link them to our entries in the wrong sense. That is the workaround I26 describes.

## What Alchemy is

Read on 2026-10-03 from the [docs](https://alchemy.run/llms.txt), the [repository](https://github.com/alchemy-run/alchemy) and npm.

| Fact | Detail |
| --- | --- |
| Version | `alchemy` 2.0.0-beta.80 on npm (2026-10-02). The README says "alpha. Expect breaking changes". |
| Licence | Apache-2.0. Its AWS emulator is a fork of floci (MIT). `@distilled.cloud/aws` (1.0.0-rc.13) is a dependency; its licence is not checked yet. |
| Effect | Peer dependencies `effect ^4.0.0` and `@effect/* ^4.0.0` (`sql-pg`, `platform-node`, `platform-bun`, `vitest`). Our exact pin 4.0.0 is inside the range. |
| Clouds | Cloudflare (`Worker`, Durable Objects, R2, KV, D1, Queues, `Workflows`, Containers) and AWS (Lambda, S3, SQS, DynamoDB, Kinesis, EC2, ECS, EKS); Hetzner and Fly.io since beta.74. |
| Local development | `alchemy dev` runs the stack on the machine: Cloudflare code in workerd, Lambda and ECS in Docker containers, close to 40 AWS services emulated (S3, DynamoDB, SQS, SNS, EventBridge, API Gateway, Step Functions, RDS, ...), no AWS account. One shared container, `alchemy-floci`. Resources without emulation deploy to a personal `Stage`; `Alchemy.remote()` opts one resource into the real cloud. Code changes reload in about 100-500 ms. |
| Durable functions | `AWS.Lambda.DurableFunction` wraps `@aws/durable-execution-sdk-js` (checkpoint and replay, `Durable.step`, `Durable.sleep`, `Durable.waitForCallback`). Cloudflare `Workflows` have a local simulator. |
| Telemetry | "Effect emits OpenTelemetry natively and the exporter is a Layer". |

## Why it matters here

- **Concepts match.** A `Layer` is a contract with swappable implementations, in the same sense as our Layer and Implementation. A `Binding` gives code a typed client for a resource and generates the IAM policy and environment it needs, which is the requirement-as-Layer idea applied to the cloud. Resources have a lifecycle (plan, apply, replace, destroy), close to Effect's scoped resources.
- **AWS local development.** `alchemy dev` does what LocalStack, SAM and SST do for AWS, from the same program that deploys. Our lab already runs services locally: Apple Container images pinned by digest in [`lab-images.json`](../../tools/qualification/lab-images.json) (Jaeger, otel-lgtm, Keycloak), and a probe refuses an image that is not pinned. Alchemy needs Docker and starts its own containers.
- **Hosting is open.** I7 has not decided where the server runs, which telemetry backend replaces the lab sinks, or how TLS is done. Alchemy is a candidate answer for the first two, and for how a `Stage` per developer or per gate run is made.
- **Our Engine overlaps.** It is a datom-backed Effect `WorkflowEngine` that runs on the phone and the server; Alchemy offers AWS durable functions and Cloudflare `Workflows`. [Research 04](../plan/bootstrap/research/04-effect-tracing-and-durability.md) already looked at the AWS Durable Execution SDK. I8 keeps Effect Cluster as our scale-out path.
- **Names clash.** See the next section.

## Names

| Alchemy term | Alchemy meaning | Ours | Relation |
| --- | --- | --- | --- |
| `Stack` | The unit you deploy: an Effect that yields resources and returns outputs | "reference stack" (what ViViEfs is) | clash in prose |
| `Stage` | An isolated copy of every resource of a `Stack`, with its own state (`dev`, `prod`, personal) | the staged `verify` (`static -> unit -> integration -> ui -> quality`), Verify step | clash |
| `Resource` | A cloud thing managed by Alchemy, such as a bucket, a queue or a database | none | new |
| `Provider` | Reads, diffs, creates, updates and deletes one resource type; also `Auth Providers` for cloud credentials | Identity provider, Provider account | clash |
| `Binding` | Connects a `Resource` to the `Runtime` that uses it, as a typed client | none | new |
| `Layer` | A service contract with swappable implementations | Layer, Implementation, Contract | same sense |
| `Runtime` | A `Resource` that carries code: a `Worker`, a Lambda function, a container, a server | Effect's `Runtime`; "lab runtime" in `AGENTS.md` | clash |
| `Worker` | A Cloudflare Worker | Worker (runs workflow executions) | clash |
| `Workflows`, `DurableFunction`, `Durable.step` | Cloudflare and AWS code that carries on after a restart | Workflow, Activity, Engine, Journal | close, not the same |
| `Sinks` | The write-side dual of an `Event Source` | telemetry sink (a pattern) | clash |
| `References` | Read an already deployed `Resource` or `Stack` at plan time | D87 references (ids rendered as links) | clash |
| `Phases` | `Construction` drives the deploy, `Runtime` handles requests | none | new |
| `State Store` | Persists resource state between deploys | Log store | different things, similar name |
| `Profiles`, `Secrets & Config`, `Output<T>`, `Action` | Accounts per environment, configuration at construction, lazy outputs, a step in the deploy graph | none | new |

Names pinned by gates (D44) are not renamed for this. Some of ours are loose already: Worker is Temporal vocabulary (D2) for something we otherwise call a device or server process.

## Questions

- **If.** Does ViViEfs need infrastructure as code at all before I7, and is Alchemy the tool, or SST, Pulumi, CDK, or plain scripts? It covers the server side only; the phone app is unaffected.
- **Why.** What does one Effect program for infrastructure and server code buy us over a separate deploy tool: typed bindings, generated IAM, the same Layers and OTel exporter, one `Stage` per developer or per gate run?
- **When.** Alchemy 2 is beta and alpha in its own words. Wait for 2.0 stable, or adopt early behind a gate? How does its `effect ^4.0.0` peer range move when we move our exact Effect pin (the gate that closed Effect 4.0.0 shows what a bump costs)?
- **How.** As a pattern with a contract, suites and a gate (deployment as a pattern), or as tooling? Read through a `repos/alchemy` reference subtree as ADR-0029 does for Effect? Which runtime fits our server, which keeps leases and a sync connection open: a container (ECS, Fly.io, Hetzner) rather than Lambda?
- **Local development.** Does `alchemy dev` replace, sit next to, or stay out of the lab? Its emulator needs Docker; our lab is Apple Container with digest-pinned images. Can `alchemy-floci` run on Apple Container and be admitted to `lab-images.json` by digest? Does Postgres for the log store come from its RDS emulation or stay our own image?
- **Durable functions.** Do Cloudflare `Workflows` or AWS durable functions ever have a place next to our Engine, or does the glossary name them in `_Avoid_` and the plan keep them out?
- **Licences.** Check floci's fork, `@distilled.cloud/aws` and everything else Alchemy pulls in, as for every addition.
- **Glossary.** Do this with I26 in one pass: which Alchemy terms become our terms if we adopt it (`Stage`, `Resource`, `Binding`?), which of ours change so the two do not clash (Worker, the `verify` stages, "stack" in prose), and which are only marked as "not our terms" with I26's mark.

## Sources

- [What is Alchemy](https://alchemy.run/what-is-alchemy/) and the [docs index](https://alchemy.run/llms.txt)
- [Local development](https://alchemy.run/concepts/local-development) and [AWS local development](https://alchemy.run/aws/local-development)
- [AWS durable function](https://alchemy.run/providers/aws/lambda/durablefunction)
- [alchemy-run/alchemy](https://github.com/alchemy-run/alchemy) and `npm view alchemy@2.0.0-beta.80`

## Comments
