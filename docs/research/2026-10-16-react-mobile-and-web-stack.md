# React stack for mobile and web: Expo or One, with the UI and backend layers

Date: 2026-10-16. Research record (D68), not a decision. The visual overview is
[2026-10-16-react-mobile-and-web-stack.html](2026-10-16-react-mobile-and-web-stack.html).

## Question

An earlier conclusion (not recorded in this repository) chose Expo with Unistyles 3.
[One](https://onestack.dev) is now a serious candidate. What are the pros and cons
for mobile and web apps, covering UI and backend, for a TypeScript and Effect
codebase that is also looking at [Alchemy](https://github.com/alchemy-run/alchemy)?

## Answer

Keep **Expo SDK 58 + Expo Router + Unistyles 3** for the app. Keep the backend as
**Effect `HttpRouter` and `RpcServer` on Node**, as `apps/evidence-server` does
today. Use Hono only as a host when a framework needs one. Take Alchemy when I7
decides hosting, behind a gate, not before. Re-evaluate One with a probe once the
four triggers in [When to look at One again](#when-to-look-at-one-again) are met.

Why, in four lines:

1. One v2 is three days old as a stable line (2.6.0 on 2026-10-13) and peers
   `react-native ^0.87.0`, which excludes the React Native 0.88 that Expo SDK 58
   and this repo pin.
2. One is close to a one-person project: `natew` has 10,261 of the top six
   contributors' 11,581 commits (about 89%).
3. One's main argument against Expo is out of date. Its FAQ says "Expo Router is
   SPA-only on web", but SDK 58 made server rendering, data loaders and middleware
   stable.
4. ViViEfs already has its own datom sync, so One's recommended data layer (Zero)
   brings nothing here. What is left is better Vite tooling and inline Swift and
   Kotlin. Both are real, but neither justifies requalifying P01 now.

## What changed since Expo + Unistyles 3 was chosen

| Date | Change | Source |
| --- | --- | --- |
| 2026-09-29 | Expo SDK 58 stable: RN 0.88, stable data loaders, server rendering, middleware, native tabs; `web.output: "server"` is the default and renders on each request | [SDK 58 changelog](https://expo.dev/changelog/sdk-58), [server rendering](https://docs.expo.dev/router/web/server-rendering.md) |
| 2026-10-07 | Unistyles 3.5.1 fixes the iOS and Android build on RN 0.88 | [v3.5.1 release](https://github.com/jpudysz/react-native-unistyles/releases/tag/v3.5.1) |
| 2026-10-10 | Tamagui 3.0: C++ native style runtime (opt-in beta), flat style props, React Strict DOM, Tailwind syntax | [v3.0.0 release](https://github.com/tamagui/tamagui/releases/tag/v3.0.0) |
| 2026-10-12 | Alchemy 2.0.0-beta.83 | `npm view alchemy` |
| 2026-10-13 | One v2 stable (2.6.0): Rolldown for native, One Native modules, Swift and Kotlin imports, `one prebuild`, `One.Updates` | [v2.6.0 release](https://github.com/onejs/one/releases/tag/v2.6.0) |
| 2026-10-15 | React Native 0.88.0 final | `npm view react-native time` |
| 2026-10-16 | One 2.7.7 (five patch releases in 48 hours) | `npm view one` |

## One, read from its own docs

Source: [onestack.dev/llms-full.txt](https://onestack.dev/llms-full.txt) (read 2026-10-16),
the [onejs/one](https://github.com/onejs/one) repository, and npm.

| Fact | Detail |
| --- | --- |
| What it is | A Vite 8 plugin with file-system routing for native and web. Started as a fork of Expo Router; "has since diverged significantly" but aims at API compatibility (FAQ). |
| Native bundler | Rolldown with Oxc, **no Babel**, in dev and production. Metro is an opt-in mode "for projects that still depend on Metro-specific resolver or transformer settings" (Metro Mode). |
| Web | Per-route SSG, SSR, SPA and API routes chosen by file suffix (`page+ssr.tsx`). `one serve` is a Hono server. Deploys to Node, Vercel (stable) and Cloudflare (mostly stable). No RSC, by choice. |
| One Native | SwiftUI (`One.iOS`), Jetpack Compose (`One.Android`), shared views (`One.UI`) and native services in the `one` package (95 reference pages), built on Nitro Modules. "Coming from Expo" maps 46 `expo-*` and community packages to it. |
| Swift and Kotlin | `.swift` and `.kt` files are imported straight from TypeScript; One generates the types and glue. |
| Requirements | React 19.2.3, React Native 0.87, New Architecture, iOS deployment target 17 (Native Setup). Peer `react-native ^0.87.0`, React Navigation 8 alphas (`npm view one@2.7.7 peerDependencies`). |
| Expo interop | Can keep Expo prebuild, EAS Build and EAS Update through `vxrn/expo-plugin`; Expo modules and config plugins keep working there. Expo Go cannot load One Native. |
| Data | "Recommends Zero as the first-class solution to data" (Introduction). |
| SQLite | `One.Database` is OP SQLite (`@op-engineering/op-sqlite` 18.2.5, the same version this repo pins). On web, `open` throws; only a `localStorage` key-value store works. |
| Crypto | Installs `crypto.getRandomValues`, `randomUUID` and `subtle.digest` (SHA-1/256/384/512) on Hermes at startup. That is the polyfill P01 gets from `expo-crypto` today. |
| Status page | Web, native, routing, deployment and One Native are marked "stable"; symbolication and Cloudflare "mostly stable"; Windows "early". |
| Licence | Repository `LICENSE` is MIT ("Copyright (c) 2023 Nate Wienert"); the npm `license` field of `one@2.7.7` says `BSD-3-Clause`. Both are Apache-2.0 compatible; the mismatch should be resolved upstream before adoption. |
| Activity | 4,599 stars, 1,694 commits in the last 13 weeks, 1,245 published versions of `one` (the name's history includes a 2013-2017 package from a previous owner). |
| Maintainers | Top contributors: natew 10,261, zetavg 1,138, then 52 and below. |

### Pros of One for ViViEfs

- **One bundler.** Vite 8 and Rolldown for native and web. The repo already runs
  Vite 8 for tests and docs, so native would join the same toolchain.
- **The Metro workaround goes away.** ADR-0004 needs a babel stub because Metro
  rejects the dynamic `import()` in Effect's `Migrator`
  ([Effect-TS/effect#6347](https://github.com/Effect-TS/effect/issues/6347), still
  open). Rolldown handles dynamic imports. Not measured here.
- **Crypto globals built in**, so `expo-crypto` is no longer needed as the Hermes polyfill.
- **Per-route render modes on web**, with `one serve` included.
- **Native code inline.** Swift and Kotlin imports plus full SwiftUI and Compose are
  a real step past Expo modules for app-specific native work.
- **Same SQLite driver** as the repo (`op-sqlite` 18.2.5).
- **Tamagui is first-class**, from the same author.

### Cons of One for ViViEfs

- **React Native version.** `^0.87.0` does not admit 0.88, and both Expo SDK 58 and
  `apps/evidence-mobile` are on 0.88. Taking One today means going back one RN
  minor and requalifying P01. RN 0.88 final shipped on 2026-10-15, so this may be
  fixed soon, but it is a gap today.
- **Maturity.** The stable v2 line is three days old and its native surface (One
  Native, 95 reference pages) is new. Navigation peers are React Navigation 8 alphas.
- **Bus factor.** About 89% of the top six contributors' commits come from one person. Expo has a company
  and many maintainers behind it (top six are each 1,500-3,300 commits).
- **Styling under no Babel.** Unistyles 3 needs its Babel plugin
  ([Unistyles docs](https://unistyl.es/llms-full.txt)). One's default native
  pipeline runs no Babel and fails the build when it finds a Babel plugin it has
  not ported. A per-file `transform: { transform: 'babel', ... }` escape exists
  (Configuration, `transform`), but Unistyles under One is **unverified**.
  Uniwind peers on `metro` and `@expo/metro-config`, so it is Metro-only.
- **Tooling coupling.** The repo drives devices with `@expo/agent-cli` and builds
  with `expo-dev-client`. One's dev-build support is the open issue
  [onejs/one#562](https://github.com/onejs/one/issues/562).
- **Data philosophy.** Zero is not used here. ViViEfs syncs its own datom log
  (ADR-0006, ADR-0017).
- **Out-of-date claim against Expo.** The FAQ's "Expo Router is SPA-only on web" is
  wrong for SDK 58. That is a reason to check every comparison One makes against
  primary sources.

## Expo SDK 58, read from its own docs

Source: [docs.expo.dev/llms.txt](https://docs.expo.dev/llms.txt) and the pages linked from it, read 2026-10-16.

| Fact | Detail |
| --- | --- |
| RN | 0.88 ("SDK 58 upgrades React Native from 0.86 to 0.88"). |
| Web | Static, server (default in SDK 58) and API routes. Data loaders, server rendering and middleware are "stable in SDK 58 and later". Async routes on web by default. |
| Server adapters | `expo-server` adapters for Bun, Express, Node `http`, Netlify, Vercel and Cloudflare Workers (`workerd`). |
| Native UI | `@expo/ui`: SwiftUI, Jetpack Compose and universal components (BottomSheet, Button, Column, ...) on Android, iOS and web. |
| Bundler | Metro for native and web ("Why Metro?"). No Vite or Rolldown plan in Expo's docs. |
| Licence | MIT. |

### Pros of Expo for ViViEfs

- **Qualified here.** P01 passed on it (ADR-0004). The evidence app, the polyfills
  and the device tooling (`@expo/agent-cli`, dev-client) are built around it.
- **Web is no longer the weak side.** SDK 58 has stable SSR, loaders, middleware
  and API routes, with adapters for every host I7 might pick.
- **Ecosystem depth and team size.** Modules, config plugins, EAS Build, Update and
  Hosting, and a release cadence tied to React Native.
- **Unistyles 3 documents Expo Router** (entry file, static rendering).

### Cons of Expo for ViViEfs

- **Metro.** A second bundler next to Vite, and the Effect `Migrator` babel stub stays.
- **Render mode is global**, not per route (`web.output`).
- **Per-request SSR with Unistyles is unverified.** Unistyles documents Next.js SSR
  and Expo static rendering, not Expo's per-request server output.

## UI layer

| Library | Version, licence | Model | Fit with Expo | Fit with One |
| --- | --- | --- | --- | --- |
| [Unistyles 3](https://unistyl.es) | 3.5.3, MIT | `StyleSheet` API, no components, C++ core on Nitro, Babel plugin; web and SSR | Documented (Expo Router guide) | Unverified: Babel plugin under a no-Babel pipeline |
| [Tamagui 3](https://tamagui.dev) | 3.0.18, MIT | Components + optimizing compiler, themes, SSR-safe; React Strict DOM and Tailwind syntax; C++ native runtime (opt-in beta) | Works, with more setup | First-class (same author) |
| [Uniwind](https://github.com/uni-stack/uniwind) | 1.12.2, MIT | Tailwind 4 for RN | Yes | No: Metro-only peers |
| [NativeWind](https://www.nativewind.dev) | 4.2.7, MIT | Tailwind 3 | Yes | Auto-detected |
| [`@expo/ui`](https://docs.expo.dev/versions/latest/sdk/ui/universal.md) | 58.x, MIT | SwiftUI, Compose and universal components | Native | Possible through Expo prebuild |
| One Native views | in `one` | SwiftUI, Compose, shared `One.UI` | No | Native |
| [react-strict-dom](https://github.com/facebook/react-strict-dom) | 0.0.55, MIT | Web-standard elements on native | Experimental | Through Tamagui 3 |

Unistyles 3 remains the best fit for a design system written as styles over
plain React Native components, which keeps the view hierarchy unchanged and
suits ADR-0019's pure views. Tamagui 3 is the better fit only if you want a
component kit and you go with One.

## Backend layer

- **Effect has its own HTTP and RPC server.** `apps/evidence-server` uses
  `HttpRouter`, `RpcServer` and `NodeHttpServer`. Hono adds nothing to that path.
- **The common format is the web-standard fetch handler.** `HttpRouter.toWebHandler`
  (`repos/effect/packages/effect/src/http/HttpRouter.ts`) turns an Effect app
  `Layer` into `(Request) => Promise<Response>`. That handler mounts unchanged in
  Hono (and so in `one serve`, which accepts your own Hono app), in Expo API routes,
  in Cloudflare Workers, and in Alchemy runtimes, which return `{ fetch }`.
  Effect's own docs show Hono through `ManagedRuntime`
  (`repos/effect/ai-docs/src/04_integration/10_managed-runtime.ts`).
- **Alchemy does not use Hono.** "hono" appears nowhere in
  [alchemy.run/llms.txt](https://alchemy.run/llms.txt) or
  [llms-full.txt](https://alchemy.run/llms-full.txt). Alchemy's API layer is Effect
  RPC and Effect `HttpApi` ([APIs](https://alchemy.run/apis)). The overlap with One
  is the fetch handler and Cloudflare as a target, not Hono.
- **Alchemy has no Expo or One resource.** It deploys Vite, TanStack Start, React
  Router, Next.js and others as `Website` resources on Cloudflare and Fly, and runs
  Effect programs on Cloudflare, AWS (Lambda, ECS), Fly and Hetzner. An Expo or One
  web build would go through `StaticSite` (static output) or a container running
  the framework's server. Version 2.0.0-beta.83, Apache-2.0, `effect ^4.0.0` peer.
  See I28.
- **The sync server needs a long-lived process** (leases, cursor stream), so a
  container or VM (Fly, Hetzner, ECS) fits it better than Lambda or a Worker.
  The web app's server can live elsewhere.

## Cost of switching to One in this repo

- Seven imports from `expo*` packages in source (`expo`, `expo-auth-session`,
  `expo-crypto`, `expo-secure-store`, `expo-sqlite`, `expo-status-bar`,
  `expo-web-browser`); each has a One Native equivalent in "Coming from Expo".
- P01 requalified: RN 0.88 to 0.87, Rolldown instead of Metro, new polyfill source,
  new bundle baseline.
- `tools/qualification` (P01 probe) and the `@expo/agent-cli` device-driving path
  in `AGENTS.md` reworked; `agent-device` stays.
- ADR-0004 amended. The app code itself is small: the evidence app has no router
  or UI kit yet.

## When to look at One again

Re-evaluate when all four hold:

1. One supports the React Native minor that the then-current Expo SDK ships.
2. The v2 line has had about three months without breaking changes.
3. A second regular maintainer appears, or a company backs One.
4. A probe passes: Effect 4 + `op-sqlite` + the datom store + the workflow
   check on iOS and Android under Rolldown, with Unistyles through a Babel
   transform or Tamagui 3, against the same checks as P01.

## Sources

- One: [docs, full text](https://onestack.dev/llms-full.txt) (Introduction, Features, Status, FAQ, Metro Mode, One Native, Native Setup, Native Platform Notes, Coming from Expo, Platform Support, Database, Crypto, Tamagui and One, one serve, Configuration); [repository](https://github.com/onejs/one); [v2.6.0 release](https://github.com/onejs/one/releases/tag/v2.6.0); [issue #562](https://github.com/onejs/one/issues/562); `npm view one@2.7.7`.
- Expo: [SDK 58 changelog](https://expo.dev/changelog/sdk-58); [server rendering](https://docs.expo.dev/router/web/server-rendering.md); [data loaders](https://docs.expo.dev/router/web/data-loaders.md); [middleware](https://docs.expo.dev/router/web/middleware.md); [API routes](https://docs.expo.dev/router/web/api-routes.md); [expo-server](https://docs.expo.dev/versions/latest/sdk/server.md); [@expo/ui universal](https://docs.expo.dev/versions/latest/sdk/ui/universal.md); [Why Metro](https://docs.expo.dev/guides/why-metro.md).
- Unistyles: [docs, full text](https://unistyl.es/llms-full.txt); [releases](https://github.com/jpudysz/react-native-unistyles/releases).
- Tamagui: [v3.0.0 release](https://github.com/tamagui/tamagui/releases/tag/v3.0.0).
- Alchemy: [docs index](https://alchemy.run/llms.txt); [full text](https://alchemy.run/llms-full.txt); [APIs](https://alchemy.run/apis); I28.
- Effect: `repos/effect` (`HttpRouter.toWebHandler`, the Hono `ManagedRuntime` example); [Effect-TS/effect#6347](https://github.com/Effect-TS/effect/issues/6347).
- npm registry (versions, licences, peers, dates) and the GitHub API (stars, contributors, commit activity), queried 2026-10-16.
