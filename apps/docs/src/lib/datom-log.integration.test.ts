// Lesson 1's widget against the exemplar (I2, D215, D216, D217): the
// scenarios the widget plays, run on the sync server as the evidence server
// composes it (PGlite, a token verifier, the sync RPCs over HTTP) and two real
// devices (each a `SyncClient` on its own sqlite-node log store, signed in to
// the fake issuer), give the same facts in every log, in the same order, and
// the same outcomes. A lesson cites evidence; it never becomes the source of a
// claim. The server is the sync server's own layer; this test, like the app,
// only chooses its platform (D220).
import { createServer } from 'node:http'
import { join } from 'node:path'
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import { describe, expect, it } from '@effect/vitest'
import { deviceLayer, evidenceCatalog, liveClock, LogStore, type DatomType } from '@viviefs/datom'
import { layerMemory } from '@viviefs/blobs'
import { createList, renameList, type CommandChangeset } from '@viviefs/evidence-model'
import { oidcTokenVerifier } from '@viviefs/identity/oidc'
import { fakeSignInSession, type FakeIssuer } from '@viviefs/identity/suites'
import { serveFakeIssuer } from '@viviefs/identity/suites/node'
import { pgliteLogStore } from '@viviefs/store-postgres'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import { SyncClient, syncClientLayer, syncRpcClientLayer, SyncRpc } from '@viviefs/sync-client'
import { Memberships, syncHttpLayer } from '@viviefs/sync-server'
import { withTempDirectory } from '@viviefs/testing/node'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import * as HttpServer from 'effect/http/HttpServer'
import * as RpcClient from 'effect/rpc/RpcClient'
import * as RpcSerialization from 'effect/rpc/RpcSerialization'
import { COMMIT_ATTRIBUTE, counts, initial, step, TITLE_ATTRIBUTE, type Action, type Changeset, type Device, type Fact, type State, type SyncNode } from './datom-log.ts'

const AUDIENCE = 'viviefs-sync'
const RPC_PATH = '/rpc'
const ORG = 'acme'
const PEOPLE: Readonly<Record<Device, string>> = { A: 'alice', B: 'bob' }

const shape = ({ e, a, op }: Fact | DatomType) => ({ e, a, op })

/**
 * The sync server's own layer (D220), on the platform the evidence server
 * chooses: PGlite, an in-memory blob store, a verifier for this issuer and
 * Node's HTTP server, on a free port.
 */
const serverLayer = (fake: FakeIssuer) =>
  syncHttpLayer(evidenceCatalog, { path: RPC_PATH }).pipe(
    Layer.provide(layerMemory),
    Layer.provide(oidcTokenVerifier({ issuer: fake.issuer, audience: AUDIENCE }).pipe(Layer.provide(FetchHttpClient.layer))),
    Layer.provideMerge(pgliteLogStore({ deviceId: 'evidence-server' }).pipe(Layer.provide(liveClock))),
    Layer.provideMerge(NodeHttpServer.layer(createServer, { host: '127.0.0.1', port: 0 })),
  )

/** The server and the two devices, as the evidence app runs them. */
const world = (fake: FakeIssuer, directory: string) =>
  Effect.gen(function* () {
    const server = yield* Layer.build(serverLayer(fake))
    const memberships = Context.get(server, Memberships)
    for (const person of Object.values(PEOPLE)) yield* memberships.grant(ORG, fake.account(person))
    const address = Context.get(server, HttpServer.HttpServer).address
    if (address._tag === 'UnixPathAddress') throw new Error('not a TCP address')
    const url = `http://127.0.0.1:${address.port}${RPC_PATH}`
    const protocol = RpcClient.layerProtocolHttp({ url }).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]))
    const device = Effect.fn(function* (who: Device) {
      const id = `device-${who.toLowerCase()}`
      const context = yield* Layer.build(
        syncClientLayer(evidenceCatalog).pipe(
          Layer.provideMerge(sqliteNodeLogStore({ filename: join(directory, `${id}.sqlite`), deviceId: id })),
          Layer.provideMerge(syncRpcClientLayer.pipe(Layer.provide(protocol), Layer.provide(fakeSignInSession(fake, PEOPLE[who])))),
          Layer.provide(deviceLayer(id)),
          Layer.provide(liveClock),
        ),
      )
      const person = yield* Context.get(server, Memberships).personOf(fake.account(PEOPLE[who]))
      return { id, person: person ?? '', store: Context.get(context, LogStore), client: Context.get(context, SyncClient), rpc: Context.get(context, SyncRpc) }
    })
    return { server: Context.get(server, LogStore), A: yield* device('A'), B: yield* device('B') }
  })

type World = Effect.Success<ReturnType<typeof world>>

/**
 * Plays actions on the model and on the real world side by side. The model's
 * tags stand for the real ones; `real` maps one to the other as they are minted.
 */
const player = (w: World) => {
  let widget: State = initial
  const real = new Map<string, string>()
  const changesets = new Map<string, CommandChangeset>()
  let sent: { readonly by: Device; readonly changeset: CommandChangeset } | null = null

  /** Runs the real command for a changeset the model built, and maps the model's tags to the real ones. */
  const build = Effect.fn(function* (by: Device, model: Changeset) {
    const d = w[by]
    const mint = { cs: yield* d.store.mint(), memberTx: yield* d.store.mint(), extraTx: yield* d.store.mint(), commitTx: yield* d.store.mint() }
    const about = { org: ORG, list: 'one', title: model.title }
    const who = { ...mint, actor: d.person, device: d.id, basis: 0 }
    const changeset =
      model.command === 'create' ? yield* createList({ exists: false }, about, who) : yield* renameList({ exists: true, title: null }, about, who)
    model.facts.forEach((fact, i) => real.set(fact.tx, changeset.datoms[i]?.tx ?? ''))
    // The same facts: attribute and op in the same order, the same title, and a commit last.
    expect(model.facts.map(shape).map(({ a, op }) => ({ a, op }))).toEqual(changeset.datoms.map(shape).map(({ a, op }) => ({ a, op })))
    expect(changeset.datoms.find(({ a }) => a === TITLE_ATTRIBUTE)?.v).toBe(model.title)
    const commit = changeset.datoms.at(-1)
    expect(commit?.a).toBe(COMMIT_ATTRIBUTE)
    expect(commit?.v.startsWith(model.facts.at(-1)?.v.slice(0, 7) ?? '-')).toBe(true)
    changesets.set(changeset.envelope.cs, changeset)
    return changeset
  })

  /** A log as the model would have it: the real tags of our changesets, in log order. */
  const logOf = Effect.fn(function* (node: SyncNode) {
    const store = node === 'server' ? w.server : w[node].store
    const rows = (yield* store.streamFrom(0)).filter(({ cs }) => changesets.has(cs))
    // A position only grows; the real store may skip numbers, the widget does not.
    expect(rows.every((row, i) => i === 0 || row.seq > (rows[i - 1]?.seq ?? 0))).toBe(true)
    return rows.map(({ tx }) => tx)
  })

  const check = Effect.fn(function* (action: Action) {
    for (const node of ['A', 'B', 'server'] as const) {
      expect(yield* logOf(node), `the log on ${node} after ${action}`).toEqual(widget.logs[node].map(({ tx }) => real.get(tx)))
    }
  })

  const play = Effect.fn(function* (action: Exclude<Action, 'reset'>) {
    const before = widget
    widget = step(widget, action)
    expect(widget, `the model allows ${action}`).not.toBe(before)
    const last = widget.last
    if (last === null) throw new Error('no step')
    const by = last.by
    if (action.startsWith('create') || action.startsWith('rename')) {
      const model = widget.outbox[by].at(-1)
      if (model === undefined) throw new Error('no changeset')
      yield* w[by].client.submit(yield* build(by, model))
    } else if (action.startsWith('sync')) {
      // Push sends the outbox, then pulls.
      const pushed = yield* w[by].client.push(ORG)
      expect(pushed.rejected).toEqual([])
      const last = [...pushed.acked].at(-1)
      const changeset = last === undefined ? undefined : changesets.get(last)
      if (changeset) sent = { by, changeset }
    } else if (action === 'sendAgain') {
      // A retry after a lost answer: the same changeset, sent again by the device that sent it.
      if (sent === null) throw new Error('nothing sent')
      yield* w[sent.by].rpc.append(sent.changeset)
    } else {
      // The bug of exercise 01.01: the same changeset, minted again.
      if (sent === null || widget.sent === null) throw new Error('nothing sent')
      const facts = last.calls.find(({ at }) => at === 'server')?.facts ?? []
      const changeset = yield* build(sent.by, { ...widget.sent.changeset, facts })
      yield* w[sent.by].client.submit(changeset)
      const pushed = yield* w[sent.by].client.push(ORG)
      expect(pushed.acked).toEqual([changeset.envelope.cs])
    }
    yield* check(action)
    return last
  })

  return { play }
}

describe("lesson 1's widget model", () => {
  it.live(
    'does what the evidence server and two devices do',
    () =>
      Effect.scoped(
        Effect.gen(function* () {
          const fake = yield* serveFakeIssuer({ audience: AUDIENCE })
          const directory = yield* withTempDirectory('viviefs-docs-widget-')
          const { play } = player(yield* world(fake, directory))

          // A creates the list, then syncs: the server stores the whole changeset; A pulls back only the commit as new.
          yield* play('create A')
          const synced = yield* play('sync A')
          expect(synced.calls.map(({ at, outcomes }) => [at, counts(outcomes)])).toEqual([
            ['server', { inserted: 3, duplicates: 0 }],
            ['A', { inserted: 1, duplicates: 2 }],
          ])

          // Sent again with the same tags: the server stores nothing.
          const again = yield* play('sendAgain')
          expect(counts(again.calls[0]?.outcomes ?? [])).toEqual({ inserted: 0, duplicates: 3 })

          // B pulls the list, then renames before it has pulled A's next rename: one fact, another position in each log.
          yield* play('sync B')
          yield* play('rename B')
          yield* play('rename A')
          yield* play('sync A')
          yield* play('sync B')

          // A, B, A: plain appends, every title kept, the list asserted once.
          yield* play('sync A')
          yield* play('rename A')
          yield* play('sync A')
          yield* play('sync B')

          // The bug: the same rename, minted again, is stored a second time.
          const twice = yield* play('newTags')
          expect(twice.calls.map(({ at, outcomes }) => [at, counts(outcomes)])).toEqual([
            ['A', { inserted: 1, duplicates: 0 }],
            ['server', { inserted: 2, duplicates: 0 }],
            ['A', { inserted: 1, duplicates: 1 }],
          ])
        }),
      ),
    60_000,
  )
})
