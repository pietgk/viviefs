# Next session: finish P11 (probe, evidence note, closing run)

## Prompt to start the session

> Read `AGENTS.md`, then `docs/plan/p11-next-session.md` (this file), then
> `docs/evidence/p11-design-review.md` (every P11 decision, Q1-Q24, the check
> list, and section 9 on the device part), ADR-0022, and the Identity section
> of `CONTEXT.md`. Continue P11 at step 7. Decisions Q1-Q24 are agreed; ask
> before deviating and record a deviation in the design review and ADR-0022.

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
| 6 device part: sign-in on iOS, Android, web | done | this session's commit |
| 7 `p11.ts` probe, evidence note, ADR-0022 Observed | **next** | |
| 8 sequential P01-P11 run on one commit | open | |

`pnpm verify` is green. Every gate in the ledger is stale (the fingerprint covers
all libs), so step 8 re-runs P01-P10 as well. `p11.ts` still refuses to pass;
keep it that way until step 7 is complete.

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

## Step 7: what to build

`p11.ts` composes the sections that exist, each with a way to fail:

1. Token contract on the fake and on Keycloak (`runKeycloakTokenChecks`).
2. The 12 Node checks (`runP11Node`).
3. A Node check over HTTP with real Keycloak tokens: alice in `acme` acked,
   `other` refused, bob never granted (the lab already runs the server).
4. The device checks on iOS, Android and web (`runP11OnPlatform`), one lab for
   all three.

Positive controls still to show for the device checks (the Node checks and the
session tests have theirs): for example a session that ignores `invalid_grant`
(check 10 must fail), a single shared replica name (check 11 must fail), web
tokens in a persistent vault (token storage must fail). Run each control once,
record the result in the evidence note, and keep the code path that makes it
possible out of production code (a lab-only env switch in the evidence app, as
P07 did with `EXPO_PUBLIC_P07_SWEEP`).

Then the evidence note `docs/evidence/<date>-p11.md` with a span review like
P09 and P10, ADR-0022 Observed, and only then `pnpm qualify` P11.

## Facts learned in step 6 (check before blaming the code)

- **iOS simulator**: after long use WebKit's GPU process can hang in the sign-in
  sheet ("A problem repeatedly occurred"). `runP11OnPlatform` reboots the
  simulator. A new development build also needs `ios/.xcode.env.local` to point
  at mise's Node (it had a stale editor-bundled path; the file is not in git).
- **agent-device on the sign-in sheet**: its tree is unreadable for a moment
  while the sheet loads, and `wait` gives up on that; the driver polls with
  `snapshot -i` every 5 s. Selectors: iOS by label (`role=textfield
  label="Username or email"`, `role=securetextfield label="Password"`), Android
  by Keycloak's HTML ids (`id="username"`, `id="password"`, `id="kc-login"`).
- **agent-device daemon** keeps the PATH it started with: stop it (`agent-device
  daemon stop`) before Android if it was started without the Android SDK.
- **Chrome on the emulator**: first-run screens, and web accessibility switched
  off after a quiet spell. `prepareAndroidChrome()` in `devices.ts` sets test
  flags (debug app plus `/data/local/tmp/chrome-command-line`).
- **A new development build** greets its first launch with a sheet
  ("Continue") that opens the developer menu; the runner dismisses both.
- **Web**: open the app at `http://localhost:8081`, not `127.0.0.1` (the redirect
  URI must match Keycloak's). Keycloak's browser session survives a reload; with
  `prompt=login` it then asks only for the remembered user's password.
- **Metro** no longer sends `Cross-Origin-Opener-Policy` (it severed the sign-in
  popup). P02, P04 and P05 web re-run in step 8 and confirm nothing needed it.
- **wa-sqlite path limit**: 64 characters including `-journal`; a longer OPFS
  database name used to hang the app silently (now bounded and reported).

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
  long-term home.
- Deferred and recorded: identity, keys and trust step (Q15 merged, Q23, Q24);
  trace projector on devices with the first consumer app (Q13);
  `EngineConfig.actor` from the statement when a consumer app runs the engine
  and sync together (design review section 9).
