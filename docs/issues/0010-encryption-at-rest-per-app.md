# I10: Encryption at rest per consumer app

Status: ready-for-human

Category: enhancement

Decide when: at the start of an app that holds sensitive data

## What

Which consumer apps turn on SQLCipher ([D50 Data at rest on device][D50]) is decided per app.

## Direction

Per app, once [P15 Encrypted store][P15] has qualified SQLCipher.

## Comments

2026-10-27: From [I54 Trust, encryption and who may sign in][I54] ([the review page](../research/2026-10-26-trust-encryption-and-sign-in-review.html)), [D149 Encryption levels][D149]: confirmed. Encryption at rest protects a lost or stolen device and sits under every encryption level; it does not change who may read. The trigger stands.

<!-- References: written by pnpm refs fix; do not edit by hand. -->

[D149]: ../plan/bootstrap/02-decision-log.md#d149
[D50]: ../plan/bootstrap/02-decision-log.md#d50
[I54]: 0054-trust-encryption-and-who-may-sign-in.md
[P15]: ../plan/bootstrap/06-qualification-gates.md#p15
