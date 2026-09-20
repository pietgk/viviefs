/**
 * P01 probe payload: the research/02 15 checks, retained as the first
 * exemplar of Effect v4 on Expo SDK 58 / Hermes. Deep imports (D22/research).
 */
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Encoding from 'effect/Encoding'
import * as Fiber from 'effect/Fiber'
import * as Layer from 'effect/Layer'
import * as Random from 'effect/Random'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'
import * as Model from 'effect/unstable/schema/Model'
import * as Activity from 'effect/unstable/workflow/Activity'
import * as Workflow from 'effect/unstable/workflow/Workflow'
import * as WorkflowEngine from 'effect/unstable/workflow/WorkflowEngine'

export type CheckStatus = 'PASS' | 'FAIL'

export type CheckResult = {
  name: string
  status: CheckStatus
  detail: string
}

const Uuid = Schema.String.pipe(Schema.brand('UuidV4'))
const Row = Schema.Struct({
  id: Model.UuidV4WithGenerate(Uuid),
})

const Person = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
})

const Greet = Workflow.make('Greet', {
  payload: { name: Schema.String },
  success: Schema.String,
  idempotencyKey: ({ name }: { name: string }) => name,
})

const GreetLive = Greet.toLayer(({ name }) =>
  Effect.gen(function* () {
    return yield* Activity.make({
      name: 'upper',
      success: Schema.String,
      execute: Effect.succeed(name.toUpperCase()),
    })
  }),
)

const runCheck = (
  name: string,
  eff: Effect.Effect<unknown, unknown, never>,
): Effect.Effect<CheckResult> =>
  eff.pipe(
    Effect.timeout('2 seconds'),
    Effect.matchCause({
      onSuccess: (value) => ({
        name,
        status: 'PASS' as const,
        detail: JSON.stringify(value),
      }),
      onFailure: (cause) => ({
        name,
        status: 'FAIL' as const,
        detail: String(cause).split('\n').slice(0, 3).join(' | '),
      }),
    }),
  )

export const P01_CHECK_NAMES = [
  'gen+sleep',
  'fibers',
  'interrupt',
  'schema decode',
  'schema error',
  'stream',
  'Clock/Duration',
  'DateTime.now+format',
  'DateTime zoned',
  'Random',
  'Encoding base64',
  'uuid (getRandomValues)',
  'abortSignal promise',
  'subtle.digest direct',
  'workflow memory',
] as const

export const globalSnapshot = (): Record<string, string> => {
  const keys = [
    'TextEncoder',
    'TextDecoder',
    'AbortController',
    'queueMicrotask',
    'setImmediate',
    'performance',
    'WeakRef',
    'FinalizationRegistry',
    'structuredClone',
    'BigInt',
    'Intl',
  ]
  const snapshot: Record<string, string> = {}
  for (const key of keys) {
    snapshot[key] = typeof (globalThis as Record<string, unknown>)[key]
  }
  snapshot['crypto.getRandomValues'] = typeof globalThis.crypto?.getRandomValues
  snapshot['crypto.subtle.digest'] = typeof globalThis.crypto?.subtle?.digest
  snapshot['Symbol.dispose'] = typeof (Symbol as { dispose?: symbol }).dispose
  snapshot['Symbol.asyncIterator'] = typeof Symbol.asyncIterator
  return snapshot
}

export const runP01Checks = (): Effect.Effect<CheckResult[]> =>
  Effect.gen(function* () {
    const checks: CheckResult[] = []
    checks.push(
      yield* runCheck(
        'gen+sleep',
        Effect.gen(function* () {
          yield* Effect.sleep('10 millis')
          return 1
        }),
      ),
    )
    checks.push(
      yield* runCheck(
        'fibers',
        Effect.gen(function* () {
          const fiber = yield* Effect.forkChild(Effect.succeed(2))
          return yield* Fiber.join(fiber)
        }),
      ),
    )
    checks.push(
      yield* runCheck(
        'interrupt',
        Effect.gen(function* () {
          const fiber = yield* Effect.forkChild(Effect.never)
          yield* Fiber.interrupt(fiber)
          return 'ok'
        }),
      ),
    )
    checks.push(
      yield* runCheck(
        'schema decode',
        Schema.decodeUnknownEffect(Person)({ name: 'a', age: 1 }),
      ),
    )
    checks.push(
      yield* runCheck(
        'schema error',
        Schema.decodeUnknownEffect(Person)({ name: 1 }).pipe(
          Effect.flip,
          Effect.map((error) => error._tag),
        ),
      ),
    )
    checks.push(
      yield* runCheck(
        'stream',
        Stream.runCollect(
          Stream.make(1, 2, 3).pipe(Stream.map((n) => n * 2)),
        ).pipe(Effect.map((chunk) => Array.from(chunk))),
      ),
    )
    checks.push(
      yield* runCheck(
        'Clock/Duration',
        Effect.map(
          Effect.clockWith((clock) =>
            Effect.succeed(clock.currentTimeNanosUnsafe()),
          ),
          (nanos) => typeof nanos,
        ),
      ),
    )
    checks.push(
      yield* runCheck(
        'DateTime.now+format',
        Effect.map(DateTime.now, (date) => DateTime.formatIso(date)),
      ),
    )
    checks.push(
      yield* runCheck(
        'DateTime zoned',
        Effect.sync(() =>
          DateTime.makeZonedUnsafe(0, { timeZone: 'Europe/Amsterdam' }).pipe(
            DateTime.formatIsoZoned,
          ),
        ),
      ),
    )
    checks.push(yield* runCheck('Random', Random.nextInt))
    checks.push(
      yield* runCheck(
        'Encoding base64',
        Effect.sync(() => Encoding.encodeBase64('héllo')),
      ),
    )
    checks.push(
      yield* runCheck(
        'uuid (getRandomValues)',
        Effect.sync(() => Row.make({}).id),
      ),
    )
    checks.push(
      yield* runCheck(
        'abortSignal promise',
        Effect.promise((signal) => Promise.resolve(typeof signal)),
      ),
    )
    checks.push(
      yield* runCheck(
        'subtle.digest direct',
        Effect.promise(() =>
          globalThis.crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode('x'),
          ),
        ).pipe(Effect.map((buffer) => buffer.byteLength)),
      ),
    )
    checks.push(
      yield* runCheck(
        'workflow memory',
        Greet.execute({ name: 'bob' }).pipe(
          Effect.provide(
            GreetLive.pipe(Layer.provideMerge(WorkflowEngine.layerMemory)),
          ),
        ),
      ),
    )
    return checks
  })
