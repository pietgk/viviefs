# I8: Engine scale-out and a multi-runner server

Status: ready-for-human

Category: enhancement

Decide when: a real server-side workflow load or an availability need, or the human schedules it for learning in the lab (D101)

## What

Server-side workflows run on one runner; Effect Cluster is the scale-out path behind the same engine interface (D39).

## Direction

Keep; the server never runs device workflows (D14).

## Comments

- 2026-10-07, [I47](0047-what-viviefs-is-about.md): out of scope means not yet (D100), and scale-out can be learned and qualified in the lab on a laptop (local containers or a local Kubernetes) without being production (D101); the `Decide when:` gains that trigger.
