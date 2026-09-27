# Bundle size - 2026-09-27

Not a gate. Records why the evidence app's bundle grew since P01, and the
budget agreed on 2026-09-27: 10 MB (10,000,000 bytes) per platform on the
shipped Hermes bundle, generous for now and revisited as the app grows.

`pnpm verify` gates it (`quality / bundle-size`) and prints the report:
`node --experimental-strip-types tools/verify/src/bundle-size.ts apps/evidence-mobile`.
The budget and the references it compares with are in
[`apps/evidence-mobile/bundle-budget.json`](../../apps/evidence-mobile/bundle-budget.json).
The breakdown attributes the minified JS to packages through Metro's source
map ([`bundle-report.ts`](../../tools/verify/src/bundle-report.ts)); the
Hermes bundle is compiled from that JS.

| Platform | Reference | Now | Budget headroom |
| --- | --- | --- | --- |
| iOS | 3.39 MB at P01 (`ba33fbe65`, 2026-09-20, no SQL import) | 4.74 MB (+40%) | 5.26 MB |
| Android | not measured at P01 | 6.84 MB (first measurement) | 3.16 MB |

## Why iOS grew

Minified JS went from 1.83 MB to 2.26 MB (+430 KB, +23%). The P01 app held
only the P01 checks; since then the evidence app gained the device runtimes
of P02-P08 and the libraries they exercise. Every byte of the difference is
attributed:

| Package | Change | Brought in by |
| --- | --- | --- |
| `effect` | +119 KB | `unstable/http` +42 KB (RPC, OTLP export), `unstable/sql` +25 KB (P02, P04), `unstable/observability` +21 KB (P03, P10), core +28 KB |
| `@viviefs/testing` | +52 KB (new) | on-device conformance runs for P04, P05, P07 |
| module wrappers (unmapped) | +42 KB | about 700 more modules, each wrapped by Metro |
| `@viviefs/datom` | +39 KB (new) | log store, projector (P04, P05) |
| `expo-notifications` | +34 KB (new) | notification wake (P07) |
| evidence app | +29 KB | the P02-P08 screens and runtimes |
| `expo-sqlite` | +22 KB (new) | fallback driver (P02) |
| `@noble/hashes` | +19 KB (new) | entity-keyed span ids (P10) |
| `@viviefs/workflow-engine` | +17 KB (new) | datom-backed engine (P06, P07) |
| `@expo/devtools` | +14 KB (new) | development build tooling |
| `@viviefs/telemetry` | +9 KB (new) | trace projector (P10) |
| `@op-engineering/op-sqlite` | +7 KB (new) | native driver (P02) |

The Hermes bundle grew more than the JS (+40% against +23%). Bytecode keeps
a string table and function metadata per module, so many small new modules
cost more than their minified size.

## Why Android is larger

Android carries FormatJS's `Intl` polyfill, which P01 added for Android only
because Hermes there cannot drive Effect's zoned `DateTime`: 2.0 MB of the
4.35 MB minified JS. `@formatjs/intl-datetimeformat` alone is 1.62 MB,
because [`intl-polyfill.ts`](../../libs/platform-native/src/intl-polyfill.ts)
loads `add-all-tz`, the full time-zone database. If Android size starts to
matter, a smaller time-zone set is the first lever; it changes P01's
measured Android fix and needs P01 re-run.

## Worth knowing

The app bundles probe code (`@viviefs/testing`, every gate runtime). A
consumer app would not; this bundle measures the evidence app, not a
product.
