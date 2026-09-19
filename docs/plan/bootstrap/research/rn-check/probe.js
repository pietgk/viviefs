// Runs a set of Effect v4 checks; reports via globalThis.__log
import { Effect, Schema, Stream, Layer, Duration, DateTime, Random, Fiber, Encoding, ManagedRuntime } from "effect"
import * as Workflow from "effect/unstable/workflow/Workflow"
import * as Activity from "effect/unstable/workflow/Activity"
import * as WorkflowEngine from "effect/unstable/workflow/WorkflowEngine"
import * as Model from "effect/unstable/schema/Model"
const Row = Schema.Struct({ id: Model.UuidV4WithGenerate(Schema.String) })

const log = (...a) => (globalThis.__log ?? console.log)(a.join(" "))

const check = (name, eff) =>
  eff.pipe(
    (globalThis.__noTimeout ? (x) => x : Effect.timeout("2 seconds")),
    Effect.matchCause({
      onSuccess: (v) => log("PASS", name, JSON.stringify(v)),
      onFailure: (c) => log("FAIL", name, String(c).split("\n").slice(0, 3).join(" | "))
    })
  )

const Person = Schema.Struct({ name: Schema.String, age: Schema.Number })

const Greet = Workflow.make("Greet", {
  payload: { name: Schema.String },
  success: Schema.String,
  idempotencyKey: ({ name }) => name
})
const GreetLive = Greet.toLayer(({ name }) => Effect.gen(function* () {
  return yield* Activity.make({ name: "upper", success: Schema.String, execute: Effect.succeed(name.toUpperCase()) })
}))

const program = Effect.gen(function* () {
  log("globals:", ["TextEncoder","TextDecoder","AbortController","queueMicrotask","setImmediate","performance","WeakRef","FinalizationRegistry","structuredClone","BigInt","Intl"].map(k => `${k}=${typeof globalThis[k]}`).join(","),
    "crypto.getRandomValues=" + typeof globalThis.crypto?.getRandomValues, "crypto.subtle.digest=" + typeof globalThis.crypto?.subtle?.digest,
    "Symbol.dispose=" + typeof Symbol.dispose, "Symbol.asyncIterator=" + typeof Symbol.asyncIterator)
  yield* check("gen+sleep", Effect.gen(function* () { yield* Effect.sleep("10 millis"); return 1 }))
  yield* check("fibers", Effect.gen(function* () { const f = yield* Effect.forkChild(Effect.succeed(2)); return yield* Fiber.join(f) }))
  yield* check("interrupt", Effect.gen(function* () { const f = yield* Effect.forkChild(Effect.never); yield* Fiber.interrupt(f); return "ok" }))
  yield* check("schema decode", Schema.decodeUnknownEffect(Person)({ name: "a", age: 1 }))
  yield* check("schema error", Schema.decodeUnknownEffect(Person)({ name: 1 }).pipe(Effect.flip, Effect.map(e => e._tag)))
  yield* check("stream", Stream.runCollect(Stream.make(1, 2, 3).pipe(Stream.map(n => n * 2))).pipe(Effect.map(c => Array.from(c))))
  yield* check("Clock/Duration", Effect.map(Effect.clockWith(c => Effect.succeed(c.currentTimeNanosUnsafe())), n => typeof n))
  yield* check("DateTime.now+format", Effect.map(DateTime.now, d => DateTime.formatIso(d)))
  yield* check("DateTime zoned", Effect.sync(() => DateTime.makeZonedUnsafe(0, { timeZone: "Europe/Amsterdam" }).pipe(DateTime.formatIsoZoned)))
  yield* check("Random", Random.nextInt)
  yield* check("Encoding base64", Effect.sync(() => Encoding.encodeBase64("héllo")))
  yield* check("uuid (getRandomValues)", Effect.sync(() => Row.make({}).id))
  yield* check("abortSignal promise", Effect.promise((signal) => Promise.resolve(typeof signal)))
  yield* check("subtle.digest direct", Effect.promise(() => globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode("x"))).pipe(Effect.map(b => b.byteLength)))
  yield* check("workflow memory", Greet.execute({ name: "bob" }).pipe(Effect.provide(GreetLive.pipe(Layer.provideMerge(WorkflowEngine.layerMemory)))))
  log("DONE")
})

export const run = () => Effect.runPromise(program).catch(e => log("TOP-LEVEL FAIL", String(e), e?.stack))
