// Lesson 2's widget against the exemplar (D216): the actions the widget
// offers, played on two real log stores on sqlite-node whose clocks the test
// controls, give the same (pt, c) for every mint and the same answer for
// every receive. A reboot is a new log store on the same file, with its
// monotonic clock started over.
import { join } from 'node:path'
import { describe, expect, it } from '@effect/vitest'
import { decodeHlc, HlcClock, LogStore } from '@viviefs/datom'
import { makeMutableClock } from '@viviefs/datom/suites'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { withTempDirectory } from '@viviefs/testing/node'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import * as Scope from 'effect/Scope'
import { initial, lastOfB, step, T0, type Action, type State } from './hlc-clock.ts'

describe("lesson 2's widget model", () => {
  it.live('mints and receives as two real log stores do', () =>
    Effect.scoped(
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-docs-clock-')
        const clocks = { A: makeMutableClock(T0), B: makeMutableClock(T0) }
        const open = Effect.fn(function* (who: 'A' | 'B') {
          const scope = yield* Scope.make()
          const layer = sqliteNodeLogStore({ filename: join(directory, `${who}.sqlite`), deviceId: `device-${who}` }).pipe(
            Layer.provide(Layer.succeed(HlcClock, clocks[who].service)),
          )
          const context = yield* Layer.buildWithScope(layer, scope)
          return { scope, store: Context.get(context, LogStore) }
        })
        const stores = { A: yield* open('A'), B: yield* open('B') }
        const txOf = new Map<string, string>()
        let widget: State = initial

        const play = Effect.fn(function* (action: Exclude<Action, 'reset'>) {
          const before = widget
          widget = step(widget, action)
          expect(widget, `the model allows ${action}`).not.toBe(before)
          if (action === 'wait') {
            clocks.A.advance(1)
            clocks.B.advance(1)
          } else if (action === 'jumpBack') {
            clocks.A.setWall(clocks.A.wall() - 120_000)
          } else if (action === 'ahead') {
            clocks.B.setWall(clocks.B.wall() + 3_000)
          } else if (action === 'reboot') {
            yield* Scope.close(stores.A.scope, Exit.void)
            clocks.A.setMonotonic(0)
            stores.A = yield* open('A')
          } else if (action === 'receive') {
            const remote = lastOfB(before)
            const exit = yield* Effect.exit(stores.A.store.receive(txOf.get(remote?.label ?? '') ?? ''))
            expect(Exit.isSuccess(exit) ? 'received' : 'refused', `receive ${remote?.label}`).toBe(widget.last?.entry?.kind)
          } else {
            const who = action === 'mint A' ? 'A' : 'B'
            const tx = yield* stores[who].store.mint()
            const parts = decodeHlc(tx)
            const entry = widget.last?.entry
            txOf.set(entry?.label ?? '', tx)
            expect({ pt: parts?.pt, c: parts?.c }, `${action}: ${entry?.label}`).toEqual(entry?.hlc)
          }
        })

        for (const action of ['mint A', 'mint A', 'wait', 'mint A', 'jumpBack', 'wait', 'mint A'] as const) yield* play(action)
        for (const action of ['reboot', 'mint A', 'wait', 'mint A'] as const) yield* play(action)
        for (const action of ['ahead', 'mint B', 'receive', 'mint A'] as const) yield* play(action)
        for (const action of ['mint B', 'wait', 'mint B', 'receive', 'mint A'] as const) yield* play(action)
      }),
    ),
  )

  it.live('refuses a tag from 6 s ahead, as the real store does', () =>
    Effect.scoped(
      Effect.gen(function* () {
        const directory = yield* withTempDirectory('viviefs-docs-clock-')
        const clocks = { A: makeMutableClock(T0), B: makeMutableClock(T0 + 6_000) }
        const storeOf = (who: 'A' | 'B') =>
          Layer.build(
            sqliteNodeLogStore({ filename: join(directory, `${who}.sqlite`), deviceId: `device-${who}` }).pipe(Layer.provide(Layer.succeed(HlcClock, clocks[who].service))),
          ).pipe(Effect.map((context) => Context.get(context, LogStore)))
        const A = yield* storeOf('A')
        const B = yield* storeOf('B')
        const widget = (['ahead', 'ahead', 'mint B', 'mint A', 'receive'] as const).reduce(step, initial)
        yield* A.mint()
        const exit = yield* Effect.exit(A.receive(yield* B.mint()))
        expect(Exit.isFailure(exit)).toBe(true)
        expect(widget.last?.entry?.kind).toBe('refused')
      }),
    ),
  )
})
