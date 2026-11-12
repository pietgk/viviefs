// Lesson 3's widget against the exemplar (D216, D223): every action played on
// a device as the code runs it, a real log store on sqlite-node, the real
// projector over the evidence catalog and the real list commands, with trace
// export reading and acknowledging the way `TraceProjector.exportOnce` does.
// A crash closes the device and opens it again on the same file. After every
// action the log, both places, the title the read models show and what the
// sink received are the model's.
import { join } from 'node:path'
import { describe, expect, it } from '@effect/vitest'
import { evidenceCatalog, liveClock, LogStore, Projector, projectorLayer } from '@viviefs/datom'
import { createList, renameList } from '@viviefs/evidence-model'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { withTempDirectory } from '@viviefs/testing/node'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import * as Scope from 'effect/Scope'
import * as Reactivity from 'effect/reactivity/Reactivity'
import * as SqlClient from 'effect/sql/SqlClient'
import { initial, step, type Action, type State } from './readers.ts'

const SINK = 'trace/motel'

const scenarios: ReadonlyArray<ReadonlyArray<Exclude<Action, 'reset'>>> = [
  ['write', 'project', 'write', 'export', 'project'],
  ['write', 'crashAfterSend', 'export', 'write', 'export'],
  ['write', 'export', 'write', 'ackThenCrash', 'write', 'export', 'project'],
]

/** The device: its store, the projector and the SQL client, on one file. */
const deviceOn = (filename: string) =>
  projectorLayer(evidenceCatalog).pipe(
    Layer.provideMerge(sqliteNodeLogStore({ filename, deviceId: 'device-a' })),
    Layer.provideMerge(Reactivity.layer),
    Layer.provideMerge(liveClock),
  )

const titleOf = (state: State) => state.log.filter(({ kind }) => kind === 'title').at(-1)?.v ?? null

describe("lesson 3's widget model", () => {
  for (const [index, actions] of scenarios.entries()) {
    it.live(`keeps each reader's place as the real code does, scenario ${index + 1}`, () =>
      Effect.scoped(
        Effect.gen(function* () {
          const filename = join(yield* withTempDirectory('viviefs-docs-readers-'), 'log.sqlite')
          let scope = yield* Scope.make()
          let device = yield* Layer.buildWithScope(deviceOn(filename), scope)
          const restart = Effect.gen(function* () {
            yield* Scope.close(scope, Exit.void)
            scope = yield* Scope.make()
            device = yield* Layer.buildWithScope(deviceOn(filename), scope)
          })
          const sink: Array<string> = []
          /** The real tx and seq of each model position, in the order they were written. */
          const real: Array<{ readonly tx: string; readonly seq: number }> = []
          const at = (place: number) => (place === 0 ? 0 : (real[place - 1]?.seq ?? -1))
          let model: State = initial

          for (const action of actions) {
            const before = model
            model = step(model, action)
            expect(model, `the model allows ${action}`).not.toBe(before)
            const store = Context.get(device, LogStore)
            if (action === 'write') {
              const mint = { cs: yield* store.mint(), memberTx: yield* store.mint(), extraTx: yield* store.mint(), commitTx: yield* store.mint() }
              const who = { ...mint, actor: 'alice', device: 'device-a', basis: 0 }
              const about = { org: 'acme', list: 'one', title: titleOf(model) ?? '' }
              const previous = titleOf(before)
              const changeset = previous === null ? yield* createList({ exists: false }, about, who) : yield* renameList({ exists: true, title: previous }, about, who)
              yield* store.append(changeset.datoms, changeset.envelope)
              const rows = yield* store.streamFrom(real.at(-1)?.seq ?? 0)
              real.push(...rows.map(({ tx, seq }) => ({ tx, seq })))
            } else if (action === 'project') {
              yield* Context.get(device, Projector).project()
            } else {
              const place = (yield* store.acknowledged(SINK)) ?? 0
              const facts = yield* store.streamFrom(place)
              const last = facts.at(-1)?.seq ?? place
              if (action !== 'ackThenCrash') sink.push(...facts.map(({ tx }) => tx))
              if (action !== 'crashAfterSend') yield* store.acknowledge(SINK, last)
              if (action !== 'export') yield* restart
            }

            const now = Context.get(device, LogStore)
            expect((yield* now.streamFrom(0)).map(({ tx }) => tx), `the log after ${action}`).toEqual(model.log.map(({ seq }) => real[seq - 1]?.tx))
            expect((yield* now.acknowledged(SINK)) ?? 0, `trace export's place after ${action}`).toBe(at(model.exporter.place))
            expect(sink, `what motel received after ${action}`).toEqual(model.exporter.received.map(({ seq }) => real[seq - 1]?.tx))
            const sql = Context.get(device, SqlClient.SqlClient)
            const cursor = (yield* sql<{ readonly seq: number }>`SELECT seq FROM projection_cursor WHERE id = 1`)[0]?.seq ?? 0
            expect(Number(cursor), `the read models' place after ${action}`).toBe(at(model.models.place))
            const titles = (yield* Context.get(device, Projector).facts({ view: 'committed' })).filter(({ a }) => a === 'evidence/list/title').map(({ v }) => v)
            expect(titles, `the title the read models show after ${action}`).toEqual(model.models.title === null ? [] : [model.models.title])
          }
          yield* Scope.close(scope, Exit.void)
        }),
      ),
    )
  }
})
