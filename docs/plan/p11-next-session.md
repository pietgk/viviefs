# P11 handover (closed 2026-09-28)

P11 is closed: the gate qualified on its own, and P01-P11 then passed in one
sequential run on a clean tree (step 8). This page stays as the record of how
P11 was built. What the lab taught, and how to run a probe alone, moved to
[tools/qualification/README.md](../../tools/qualification/README.md)
(2026-10-01), the one place for them.

Next: Docs and teaching, then the follow-on gates (P12-P17 since the Docs and
teaching grilling). The current handover is [next-session.md](next-session.md).
Step numbers below are P11's build steps (P11.1-P11.8 in today's naming).

## Where P11 stands (2026-09-28)

| Step | State | Commits |
| --- | --- | --- |
| Grilling Q1-Q24, glossary, ADRs | done | `1108faa20`, `2a28165d4`, `0c439d765` |
| 2 `libs/identity`, fake issuer, token contract | done | `480ae7cd1`, `3917240e2` |
| 3 log, protocol, server, client, Node checks | done | `90737d778`, `c9db02c48`, `d28cfc37c` |
| HLC whole-millisecond fix (found by step 4) | done | `21b34d7e1` (ADR-0007) |
| 4 `apps/evidence-server` over HTTP | done | `b608fa7c4` |
| 5 Keycloak lab, token contract on Keycloak | done | `c47621ec9` |
| 6 server part: `Caller` RPC | done | `0ff083119` |
| 6 device part: sign-in on iOS, Android, web | done | `aaf55a4f3` |
| 7 `p11.ts` probe, evidence note, ADR-0022 Observed | done | the step 7 commit |
| 7 `pnpm qualify` P11 on the committed tree | pass `2026-09-28T19-38-22.564Z-0f0ac08c` | `971ae6e28` |
| 8 sequential P01-P11 run on one commit | pass `2026-09-28T22-40-46.395Z-cfafc842` | `46e9c22b6`, `ec775f86e`, `d592d67e0`, `4d192db41`, `59b74a9a2` |

`pnpm verify` is green. Every gate from P01 to P11 passes in the ledger on
`59b74a9a`.

## What step 6 left ready

- `tools/qualification/src/probes/p11-lab.ts`: `startP11Lab(artifacts)` starts
  Keycloak and the evidence server (alice granted `acme`, bob a member of
  nothing, CORS for `http://localhost:8081`). Run it alone to drive a device by
  hand; it prints the passwords.
- `tools/qualification/src/probes/p11-device.ts`: `runP11OnPlatform({ platform,
  lab, artifacts })` starts the app (Expo web in Chromium, or the development
  build on a rebooted simulator or the emulator) and runs one scenario with six
  checks: `PKCE sign-in`, `cross-organization denied on the device`, `token
  storage`, `sign-in needed keeps the outbox`, `local replica per provider
  account`, `removing the account deletes its replica`. Run alone:
  `mise exec -- node --experimental-strip-types tools/qualification/src/probes/p11-device.ts web ios android`.
  All six passed on each platform on 2026-09-28 (measurement runs, no ledger).
- `libs/testing/src/sign-in-session.test.ts`: 10 tests of the session on the
  served fake issuer (which now has token and revocation endpoints).

## Step 7: what was built

`p11.ts` composes five sections, each able to fail: the token contract on the
fake verifier, on the OIDC verifier against a served fake and against Keycloak;
the 12 Node checks and their span review (`p11-spans.ts`, drift-checked against
[`2026-09-28-p11.md`](../evidence/2026-09-28-p11.md) by the probe and by
`p11.test.ts`); four checks over HTTP with Keycloak's tokens (`p11-http.ts`);
the six device checks on iOS, Android and web; and three device controls on web.

The controls are lab-only defects in the evidence app
(`apps/evidence-mobile/src/p11-control.ts`, `EXPO_PUBLIC_P11_CONTROL`, shown on
the screen): `ignore-invalid-grant`, `shared-replica`, `persistent-web-vault`.
The probe requires each to fail exactly its check first. They run in every
qualification (about 2 minutes), like P07's no-sweep control. Run one alone:
`mise exec -- node --experimental-strip-types tools/qualification/src/probes/p11-device.ts web --control shared-replica`.

A full measurement run took about 10 minutes and passed every section.

## Step 8: the closing run

`pnpm qualify --through P11` (added for this run; a plain run also runs
P12-P14, which refuse by design) passed on `59b74a9a` in 35 minutes. Four
earlier runs each failed on lab state that outlives a gate or on a harness
timeout; each was fixed before the next run. Details and the fixes:
[2026-09-28-p01-p11-closure.md](../evidence/2026-09-28-p01-p11-closure.md).
P02, P04 and P05 passed on web, so nothing needed Metro's
`Cross-Origin-Opener-Policy`.

## Facts learned in steps 6 and 8

Moved to [tools/qualification/README.md](../../tools/qualification/README.md#lab-facts-check-these-before-blaming-the-code).

## Working notes

- Run Node through mise: `mise exec -- pnpm verify`, `mise exec -- node
  --experimental-strip-types <file>` (the shell's Node 24 is refused).
- After adding a workspace dependency, run `mise exec -- pnpm exec nx sync`.
- P09's evidence note has a generated span review with line anchors into
  `p09-checks.ts`. Editing that file shifts anchors; regenerate the block from the
  probe (`spanReview(spans)` between the `span-review` markers), never by hand.
- Run a probe file directly for a measurement without a ledger entry; only `pnpm
  qualify` writes the ledger.
- Teaching pages for P11 are in `.lavish/` (committed): Q5 token transport, log
  tampering, identity keys and trust. Work order step 7 (docs site) decides their
  long-term home (they moved to `docs/research/`, D68).
- Deferred and recorded: identity, keys and trust step (Q15 merged, Q23, Q24);
  trace projector on devices with the first consumer app (Q13);
  `EngineConfig.actor` from the statement when a consumer app runs the engine
  and sync together (design review section 9).
