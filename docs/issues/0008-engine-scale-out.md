# I8: Engine scale-out and a multi-runner server

Status: ready-for-human

Category: enhancement

Decide when: a real server-side workflow load or an availability need, or the human schedules it for learning in the lab ([D101 Lab and production][D101])

## What

Server-side workflows run on one runner; scale-out is more runners writing on the journal fence ([D39' One engine, one journal, one fence][D39'], [D14' The journal is the fence][D14']), and Effect Cluster is no longer the path.

## Direction

Scale-out is more server runners writing on the journal head ([D14' The journal is the fence][D14'], [ADR-0036 The journal is the fence][ADR-0036]). A runner's sweep takes runs whose head has not moved within their running step's timeout, and runners claim a step before acting. A recurring job (compaction, a sweep of due clocks) is a server workflow on a durable clock, so it needs no Singleton ([D138 A workflow, or a cursor][D138]). The server never runs device workflows ([D13 Server holds workflow state][D13]).

## Comments

- 2026-10-07, [I47](0047-what-viviefs-is-about.md): out of scope means not yet ([D100 Out of scope means not yet][D100]), and scale-out can be learned and qualified in the lab on a laptop (local containers or a local Kubernetes) without being production ([D101 Lab and production][D101]); the `Decide when:` gains that trigger.

- 2026-10-26, [I51](0051-actors-or-the-engine.md): Direction rewritten ([D39' One engine, one journal, one fence][D39'], [D14' The journal is the fence][D14']). Effect Cluster is not needed: it fences by time only, keeps its own journal in `MessageStorage`, which fits the log poorly (claims rewritten on every read, deletes, a compare-and-delete), and assumes runners that are always reachable, which a device cannot be. It stays possible behind `WorkflowEngine` if a measured load needs its routing in memory. The `Decide when:` is unchanged; the journal fence itself is built by [I80 Build the journal fence][I80].
- 2026-10-27, [I59](0059-bring-adr-0002-and-the-vision-in-line-with-i47.md): 01-vision's out-of-scope line now reads as [D39' One engine, one journal, one fence][D39'] has it (more runners on each run's journal head, not Effect Cluster), production only and so learnable in the lab ([D158 The out-of-scope list, item by item][D158]). What must stay possible: the head check in one step with the append, a claim before acting, and `WorkflowEngine` as the one interface. The `Decide when:` is unchanged.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[ADR-0036]: ../adr/0036-the-journal-is-the-fence.md
[D100]: ../plan/bootstrap/02-decision-log.md#d100
[D101]: ../plan/bootstrap/02-decision-log.md#d101
[D13]: ../plan/bootstrap/02-decision-log.md#d13
[D138]: ../plan/bootstrap/02-decision-log.md#d138
[D14']: ../plan/bootstrap/02-decision-log.md#d14p
[D158]: ../plan/bootstrap/02-decision-log.md#d158
[D39']: ../plan/bootstrap/02-decision-log.md#d39p
[I80]: 0080-build-the-journal-fence.md
