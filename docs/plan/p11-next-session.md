# Next session: finish P11 (device sign-in, probe, closing run)

## Prompt to start the session

> Read `AGENTS.md`, then `docs/plan/p11-next-session.md` (this file), then
> `docs/evidence/p11-design-review.md` (every P11 decision, Q1-Q24, and the check
> list), ADR-0022, and the Identity section of `CONTEXT.md`. Continue P11 at step
> 6, device part. Decisions Q1-Q24 are agreed; ask before deviating and record a
> deviation in the design review and ADR-0022.

## Where P11 stands (2026-09-28)

| Step | State | Commits |
| --- | --- | --- |
| Grilling Q1-Q24, glossary, ADRs | done | `1108faa20`, `2a28165d4`, `0c439d765` |
| 2 `libs/identity`, fake issuer, token contract | done | `480ae7cd1`, `3917240e2` (jose split: contract in the root, `jose` in `@viviefs/identity/oidc`) |
| 3 log, protocol, server, client, Node checks | done | `90737d778`, `c9db02c48`, `d28cfc37c` |
| HLC whole-millisecond fix (found by step 4) | done | `21b34d7e1` (ADR-0007) |
| 4 `apps/evidence-server` over HTTP | done | `b608fa7c4` |
| 5 Keycloak lab, token contract on Keycloak | done | `c47621ec9` |
| 6 server part: `Caller` RPC | done | `0ff083119` |
| 6 device part: sign-in on iOS, Android, web | **next** | |
| 7 `p11.ts` probe, evidence note, ADR-0022 Observed | open | |
| 8 sequential P01-P11 run on one commit | open | |

`pnpm verify` is green. Every gate in the ledger is stale (the fingerprint covers
all libs), so step 8 re-runs P01-P10 as well. `p11.ts` still refuses to pass;
keep it that way until step 7 is complete.

## Step 6, device part: what to build

Checks it must make pass (design review section 1): **2** PKCE sign-in, **10**
sign-in needed keeps the outbox, **11** local replica per provider account, and
the device leg of **3** (a member is served, another organization refused). iOS
simulator, Android emulator and web are all first-class.

1. **`SignInSession` implementation** for the evidence app (`apps/evidence-mobile`,
   or a `platform:native` / `platform:client` lib if it is reused). The contract is
   in `libs/identity/src/sign-in-session.ts` and today only has `accessToken`; add
   sign-in, sign-out and the state (signed in, sign-in needed) as the device needs
   them, keeping the glossary's meaning: signing out ends the session.
   - PKCE with `expo-auth-session` against client `viviefs-mobile`, issuer
     `http://localhost:28080/realms/viviefs`. Redirects configured in the lab realm:
     `viviefs-evidence://auth` (the app's scheme) and `http://localhost:8081/*` (web).
   - iOS and Android: refresh token in `expo-secure-store`, scope `offline_access`
     (Q9). Web: tokens in memory only.
   - A refused refresh (`invalid_grant`) moves to sign-in needed; the outbox stays.
2. **`Caller` after sign-in** (Q22): call `SyncRpc.caller`, keep the
   `CallerStatement` inside the sign-in session, label writes with its `person`,
   refetch it at every sign-in and after a `MembershipMissing` or `ActorMismatch`.
   The engine's `EngineConfig.actor` is that person.
3. **Local replica per provider account** (Q11 as amended): one database per
   `(iss, sub)`, for example a file named from a hash of the pair. Signing out
   closes it; "remove this account from this device" deletes it.
4. **Wiring**: `RpcClient.layerProtocolHttp({ url })` to the evidence server at
   `http://localhost:8787/rpc`, `FetchHttpClient.layer`,
   `RpcSerialization.layerNdjson`, and `bearerAuthenticationClient` from
   `@viviefs/sync-client` provided with the `SignInSession`.
5. **Screens**: sign-in, signed-in (person and organizations from `Caller`),
   sign-in needed, and a sync action, with `testID` and `accessibilityLabel` so
   `agent-device` can drive them (AGENTS.md: never tap coordinates or scrape Metro
   logs).
6. **Lab plumbing for the probe**: start Keycloak (`startKeycloak` in
   `tools/qualification/src/probes/keycloak.ts`) and the evidence server
   (`apps/evidence-server/src/main.ts` with `VIVIEFS_ISSUER`, `VIVIEFS_SEED` naming
   alice in `acme` by her pinned id `a11ce000-0000-4000-8000-00000000a11c`). Android
   needs `adb reverse tcp:28080 tcp:28080` and `adb reverse tcp:8787 tcp:8787` so
   the issuer stays `localhost` (Q6).

## Known risks and facts to check first

- **`offline_access` on the lab users.** The realm import gives users only the
  roles listed (`member`); a password-grant token showed `realm_access.roles:
  ["member"]`. Keycloak's `default-roles-viviefs` (which includes
  `offline_access`) may not be assigned. Check before relying on offline refresh;
  if needed add the role to the users or the client scope in `keycloak.ts`.
- **iOS consent sheet.** `ASWebAuthenticationSession` shows a system prompt
  before the login page. If `agent-device` cannot confirm it, ask the user; do not
  skip iOS (Q6).
- **Android browser.** The login page opens in a Custom Tab; drive it through the
  accessibility tree.
- **New dependencies** need a licence check (Apache-2.0 repo): likely
  `expo-auth-session`, `expo-web-browser`, `expo-secure-store` (Expo SDK 58
  versions, pinned exactly). Native modules mean a new development build.
- **Bundle budget** (10 MB per platform, gated by `verify`): the device must import
  `@viviefs/identity` (root) only, never `@viviefs/identity/oidc` or
  `@viviefs/testing/identity`, which carry `jose`.

## Step 7 and step 8

- `p11.ts` runs: the token contract on the fake and on Keycloak
  (`runKeycloakTokenChecks`), the 12 Node checks (`runP11Node`), a Node check over
  HTTP with real Keycloak tokens (alice in `acme` acked, `other` refused, bob never
  granted), then the device checks on iOS, Android and web. Each check needs a way
  to fail; keep the positive controls.
- Evidence note `docs/evidence/<date>-p11.md` with a span review like P09 and P10,
  then ADR-0022 Observed. Only the ledger passes a gate.
- Step 8: `pnpm qualify` P01-P11 sequentially on one committed tree.

## Working notes from this session

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
  trace projector on devices with the first consumer app (Q13).
