# I75: Expo 58's production bundle carries its development tooling

Status: needs-triage

Category: bug

Found: 2026-10-22

## What

Since the repin to Expo SDK 58 stable (`expo` 58.0.17, `react-native` 0.88.0), `expo export` puts development-only modules into the shipped bundle: Metro's `HMRClient`, Expo's `async-require/hmr` and `hmrUtils`, `@expo/log-box-utils`, and `pretty-format` with `react-is` and `ansi-styles`, about 30 KB of JavaScript per platform. On `58.0.0-preview.3` none of them were in the bundle.

Every path that reaches them is guarded: `expo/build/async-require/setup.js` requires `./setupHMR` under `if (__DEV__ && typeof window !== 'undefined')`, `loadBundle.js` requires `./hmr` only when `process.env.NODE_ENV !== 'production'`, and `@expo/metro-runtime`'s index requires `promiseRejectionTracking` (which requires `pretty-format`) under `if (__DEV__)`. So in a production export the branches should fold away and take the requires with them; the code is still there.

Ruled out on the Linux arm64 sandbox, each with a clean `expo export --platform ios --no-bytecode --clear`: an explicit `NODE_ENV=production` gives the identical bundle (2582064 bytes), and so does a `babel.config.js` that keys its cache on `NODE_ENV` instead of `api.cache(true)`. The bundle-size gate passes (5.52 MB iOS, 7.63 MB Android of 10 MB), so nothing is blocked.

To do: find which module's require survives (Metro 0.87's dependency collection or Expo's transform), reproduce it in a new `create-expo-app` project on SDK 58, and draft an upstream issue for a human to post ([upstream-issues.md](../plan/upstream-issues.md)).

## Comments
