import { join } from 'node:path'
import * as Cause from 'effect/Cause'
import * as Context from 'effect/Context'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Fiber from 'effect/Fiber'
import * as Layer from 'effect/Layer'
import * as Latch from 'effect/Latch'
import * as Schedule from 'effect/Schedule'
import * as Schema from 'effect/Schema'
import type * as Scope from 'effect/Scope'
import * as DurableDeferred from 'effect/unstable/workflow/DurableDeferred'
import * as RpcTest from 'effect/unstable/rpc/RpcTest'
import * as Workflow from 'effect/unstable/workflow/Workflow'
import { blobHash, layerMemory } from '@viviefs/blobs'
import {
  Attr,
  HlcClock,
  LogStore,
  Projector,
  activityId,
  deviceLayer,
  encodeCommit,
  evidenceCatalog,
  evidenceId,
  executionId,
  hashMembers,
  itemId,
  listId,
  orgId,
  type Catalog,
  type DatomType,
} from '@viviefs/datom'
import { renameList, sealItem } from '@viviefs/evidence-model'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import {
  SyncClient,
  SyncRpc,
  syncClientLayer,
  syncRpcLayer,
  type Outgoing,
} from '@viviefs/sync-client'
import { SyncRpcs } from '@viviefs/sync-protocol'
import { SyncAuthority, syncServerLayer } from '@viviefs/sync-server'
import {
  makeMutableClock,
  withTempDirectory,
  type CheckResult,
  type MutableClock,
} from '@viviefs/testing'
import {
  CrashHook,
  encodeExit,
  encodeLease,
  engineConfigLayer,
  engineLayer,
  noopWakeScheduler,
} from '@viviefs/workflow-engine'

export const P09_CHECK_NAMES = [
  'outbox offline',
  'cursor stream',
  'full organization',
  'duplicate append',
  'typed rejection rebuilds',
  'unknown attribute',
  'stale lease rejected',
  'server deferred completion',
  'file manifest waits',
] as const

export const P09_CHECK_COUNT = P09_CHECK_NAMES.length

const catalog: Catalog = { types: [...evidenceCatalog.types] }

const TRACE = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const SPAN = 'bbbbbbbbbbbbbbbb'

const require = (ok: boolean, message: string) =>
  ok ? Effect.void : Effect.fail(message)

const valueOf = (
  facts: ReadonlyArray<{ e: string; a: string; v: string }>,
  entity: string,
  attribute: string,
): string | undefined =>
  facts.find((fact) => fact.e === entity && fact.a === attribute)?.v

const runCheck = (
  name: string,
  effect: Effect.Effect<unknown, unknown, Scope.Scope>,
): Effect.Effect<CheckResult, never, Scope.Scope> =>
  effect.pipe(
    Effect.timeout(Duration.seconds(30)),
    Effect.matchCause({
      onSuccess: (value) => ({
        name,
        status: 'PASS' as const,
        detail: JSON.stringify(value),
      }),
      onFailure: (cause) => ({
        name,
        status: 'FAIL' as const,
        detail: Cause.pretty(cause).split('\n')[0] ?? 'failed',
      }),
    }),
  )

type Device = {
  readonly id: string
  readonly client: SyncClient['Service']
  readonly store: LogStore['Service']
  readonly projector: Projector['Service']
  readonly rpc: SyncRpc['Service']
  readonly context: Context.Context<
    SyncClient | LogStore | Projector | SyncRpc
  >
}

const clockLayer = (clock: MutableClock) =>
  Layer.succeed(HlcClock, clock.service)

const storeLayer = (
  directory: string,
  file: string,
  deviceId: string,
  clock: MutableClock,
) =>
  sqliteNodeLogStore({
    filename: join(directory, file),
    deviceId,
  }).pipe(Layer.provide(clockLayer(clock)))

const envelopeFor = (
  cs: string,
  device: string,
  command: string,
  leaseEpoch: number | null,
) => ({
  cs,
  actor: device,
  device,
  leaseEpoch,
  traceId: TRACE,
  spanId: SPAN,
  sampled: false,
  command,
})

const session = <A>(
  directory: string,
  clock: MutableClock,
  prefix: string,
  devices: ReadonlyArray<readonly [string, string]>,
  use: (world: {
    readonly authority: SyncAuthority['Service']
    readonly device: (name: string) => Device
  }) => Effect.Effect<A, unknown>,
) =>
  Effect.gen(function* () {
    const server = yield* Layer.build(
      syncServerLayer(catalog).pipe(
        Layer.provide(
          storeLayer(directory, `${prefix}-server.sqlite`, 'p09-server', clock),
        ),
        Layer.provide(layerMemory),
      ),
    )
    const rpcClient = yield* RpcTest.makeClient(SyncRpcs).pipe(
      Effect.provide(server),
    )
    const rpc = syncRpcLayer(rpcClient)
    const built = new Map<string, Device>()
    for (const [name, deviceId] of devices) {
      const ctx = yield* Layer.build(
        syncClientLayer(catalog).pipe(
          Layer.provideMerge(
            storeLayer(directory, `${prefix}-${name}.sqlite`, deviceId, clock),
          ),
          Layer.provideMerge(rpc),
          Layer.provide(clockLayer(clock)),
        ),
      )
      built.set(name, {
        id: deviceId,
        client: Context.get(ctx, SyncClient),
        store: Context.get(ctx, LogStore),
        projector: Context.get(ctx, Projector),
        rpc: Context.get(ctx, SyncRpc),
        context: ctx,
      })
    }
    const authority = Context.get(server, SyncAuthority)
    return yield* use({
      authority,
      device: (name) => {
        const found = built.get(name)
        if (!found) {
          throw new Error(`missing device ${name}`)
        }
        return found
      },
    })
  })

const mint = (device: Device, basis: number) =>
  Effect.gen(function* () {
    const cs = yield* device.store.mint()
    const memberTx = yield* device.store.mint()
    const extraTx = yield* device.store.mint()
    const commitTx = yield* device.store.mint()
    return {
      cs,
      memberTx,
      extraTx,
      commitTx,
      actor: device.id,
      device: device.id,
      basis,
    }
  })

const selfCommit = (
  device: Device,
  options: {
    readonly org: string
    readonly entity: string
    readonly attribute: string
    readonly value: string
    readonly epoch: number | null
    readonly command: string
  },
) =>
  Effect.gen(function* () {
    const tx = yield* device.store.mint()
    const changeset: Outgoing = {
      org: options.org,
      basis: 0,
      envelope: envelopeFor(tx, device.id, options.command, options.epoch),
      datoms: [
        {
          e: options.entity,
          a: options.attribute,
          v: options.value,
          tx,
          op: 'assert',
          cs: tx,
        },
      ],
    }
    yield* device.client.submit(changeset)
    return changeset
  })

const committed = (device: Device, prefix: string) =>
  device.projector.facts({ view: 'committed', prefix })

const outboxOffline = (directory: string, clock: MutableClock) =>
  session(directory, clock, 'offline', [
    ['a', 'p09-a'],
    ['b', 'p09-b'],
  ], (world) =>
    Effect.gen(function* () {
      const org = 'offline'
      const a = world.device('a')
      const b = world.device('b')
      const list = listId(org, 'one')
      const minted = yield* mint(a, 0)
      const changeset = yield* renameList(
        { title: null },
        { org, list: 'one', title: 'local' },
        minted,
      )
      yield* a.client.submit(changeset)
      yield* b.client.pull(org)
      const remote = yield* committed(b, orgId(org))
      yield* require(
        valueOf(remote, list, Attr.listTitle) === undefined,
        'offline peer saw a local write',
      )
      const draft = yield* a.projector.facts({
        view: 'draft',
        actor: a.id,
        prefix: orgId(org),
      })
      yield* require(
        valueOf(draft, list, Attr.listTitle) === 'local',
        `draft ${JSON.stringify(draft)}`,
      )
      const pushed = yield* a.client.push(org)
      yield* require(pushed.acked.length === 1, JSON.stringify(pushed))
      yield* b.client.pull(org)
      const after = yield* committed(b, orgId(org))
      yield* require(
        valueOf(after, list, Attr.listTitle) === 'local',
        `after push ${JSON.stringify(after)}`,
      )
      return { acked: pushed.acked.length }
    }),
  )

const cursorStream = (directory: string, clock: MutableClock) =>
  session(directory, clock, 'stream', [
    ['a', 'p09-a'],
    ['b', 'p09-b'],
  ], (world) =>
    Effect.gen(function* () {
      const org = 'stream'
      const a = world.device('a')
      const b = world.device('b')
      const first = listId(org, 'one')
      const second = listId(org, 'two')
      const mint1 = yield* mint(a, 0)
      yield* a.client.submit(
        yield* renameList(
          { title: null },
          { org, list: 'one', title: 'one' },
          mint1,
        ),
      )
      const mint2 = yield* mint(a, 0)
      yield* a.client.submit(
        yield* renameList(
          { title: null },
          { org, list: 'two', title: 'two' },
          mint2,
        ),
      )
      yield* a.client.push(org)
      const cursor = yield* b.client.pull(org)
      const facts = yield* committed(b, orgId(org))
      yield* require(valueOf(facts, first, Attr.listTitle) === 'one', 'one')
      yield* require(valueOf(facts, second, Attr.listTitle) === 'two', 'two')
      const before = yield* b.projector.snapshot()
      const again = yield* b.client.pull(org)
      const after = yield* b.projector.snapshot()
      yield* require(before === after, 'second pull changed the read model')
      yield* require(again === cursor, `cursor ${cursor} -> ${again}`)
      return { cursor }
    }),
  )

const fullOrganization = (directory: string, clock: MutableClock) =>
  session(directory, clock, 'orgs', [
    ['a', 'p09-a'],
    ['b', 'p09-b'],
  ], (world) =>
    Effect.gen(function* () {
      const a = world.device('a')
      const b = world.device('b')
      const acme = 'acme'
      const other = 'other'
      const acmeList = listId(acme, 'one')
      const otherList = listId(other, 'one')
      yield* a.client.submit(
        yield* renameList(
          { title: null },
          { org: acme, list: 'one', title: 'acme' },
          yield* mint(a, 0),
        ),
      )
      yield* b.client.submit(
        yield* renameList(
          { title: null },
          { org: other, list: 'one', title: 'other' },
          yield* mint(b, 0),
        ),
      )
      yield* a.client.push(acme)
      yield* b.client.push(other)
      const cursor = yield* a.client.pull(acme)
      const acmeFacts = yield* committed(a, orgId(acme))
      const leaked = yield* committed(a, orgId(other))
      yield* require(
        valueOf(acmeFacts, acmeList, Attr.listTitle) === 'acme',
        JSON.stringify(acmeFacts),
      )
      yield* require(
        valueOf(leaked, otherList, Attr.listTitle) === undefined,
        `other org leaked ${JSON.stringify(leaked)}`,
      )
      const again = yield* a.client.pull(acme)
      yield* require(again === cursor, `cursor ${cursor} -> ${again}`)
      const otherFacts = yield* committed(b, orgId(other))
      yield* require(
        valueOf(otherFacts, otherList, Attr.listTitle) === 'other',
        JSON.stringify(otherFacts),
      )
      return { orgs: 2, cursor }
    }),
  )

const duplicateAppend = (directory: string, clock: MutableClock) =>
  session(directory, clock, 'dedup', [
    ['a', 'p09-a'],
    ['b', 'p09-b'],
  ], (world) =>
    Effect.gen(function* () {
      const org = 'dedup'
      const a = world.device('a')
      const b = world.device('b')
      const list = listId(org, 'one')
      const changeset = yield* renameList(
        { title: null },
        { org, list: 'one', title: 'once' },
        yield* mint(a, 0),
      )
      yield* a.client.submit(changeset)
      yield* a.client.push(org)
      const again = yield* a.rpc.append({
        org,
        basis: changeset.basis,
        envelope: changeset.envelope,
        datoms: [...changeset.datoms],
      })
      yield* b.client.pull(org)
      const facts = yield* committed(b, orgId(org))
      const titles = facts.filter(
        (fact) => fact.e === list && fact.a === Attr.listTitle,
      )
      yield* require(titles.length === 1, JSON.stringify(titles))
      yield* require(again.cursor > 0, 'missing ack')
      return { cursor: again.cursor }
    }),
  )

const typedRejection = (directory: string, clock: MutableClock) =>
  session(directory, clock, 'reject', [
    ['a', 'p09-a'],
    ['b', 'p09-b'],
  ], (world) =>
    Effect.gen(function* () {
      const org = 'reject'
      const a = world.device('a')
      const b = world.device('b')
      const item = itemId(org, 'list', 'item')
      const list = listId(org, 'list')
      yield* b.client.submit(
        yield* renameList(
          { title: null },
          { org, list: 'list', title: 'box' },
          yield* mint(b, 0),
        ),
      )
      yield* b.client.push(org)
      yield* a.client.pull(org)
      yield* b.client.submit(
        yield* sealItem(
          { org, list: 'list', item: 'item', seal: 'gold' },
          yield* mint(b, 0),
        ),
      )
      yield* b.client.push(org)
      const silver = yield* sealItem(
        { org, list: 'list', item: 'item', seal: 'silver' },
        yield* mint(a, 0),
      )
      const kept = yield* renameList(
        { title: null },
        { org, list: 'list', title: 'kept' },
        yield* mint(a, 0),
      )
      yield* a.client.submit(silver)
      yield* a.client.submit(kept)
      const draft = yield* a.projector.facts({
        view: 'draft',
        actor: a.id,
        prefix: orgId(org),
      })
      yield* require(valueOf(draft, item, Attr.itemSeal) === 'silver', 'draft seal')
      yield* require(valueOf(draft, list, Attr.listTitle) === 'kept', 'draft title')
      const pushed = yield* a.client.push(org)
      yield* require(pushed.rebuilt, JSON.stringify(pushed))
      yield* require(
        pushed.rejected.some((row) => row.tag === 'BasisRejected'),
        JSON.stringify(pushed.rejected),
      )
      yield* require(pushed.acked.length === 1, JSON.stringify(pushed.acked))
      const facts = yield* committed(a, orgId(org))
      yield* require(
        valueOf(facts, item, Attr.itemSeal) === 'gold',
        `seal ${JSON.stringify(facts)}`,
      )
      yield* require(
        valueOf(facts, list, Attr.listTitle) === 'kept',
        `title ${JSON.stringify(facts)}`,
      )
      yield* require(
        valueOf(facts, item, Attr.itemSeal) !== 'silver',
        'rejected seal stayed visible',
      )
      return { rejected: pushed.rejected.length }
    }),
  )

const unknownAttribute = (directory: string, clock: MutableClock) =>
  session(directory, clock, 'upgrade', [['a', 'p09-a']], (world) =>
    Effect.gen(function* () {
      const org = 'upgrade'
      const a = world.device('a')
      const tx = yield* a.store.mint()
      const memberTx = yield* a.store.mint()
      const commitTx = yield* a.store.mint()
      const entity = listId(org, 'one')
      const member: DatomType = {
        e: entity,
        a: 'evidence/not-shipped',
        v: 'x',
        tx: memberTx,
        op: 'assert',
        cs: tx,
      }
      const hashed = yield* hashMembers([member]).pipe(Effect.orDie)
      const changeset: Outgoing = {
        org,
        basis: 0,
        envelope: envelopeFor(tx, a.id, 'evidence.unknown', null),
        datoms: [
          member,
          {
            e: tx,
            a: Attr.changesetCommit,
            v: encodeCommit({ n: 1, hash: hashed, basis: 0, files: [] }),
            tx: commitTx,
            op: 'assert',
            cs: tx,
          },
        ],
      }
      yield* a.client.submit(changeset)
      const pushed = yield* a.client.push(org)
      yield* require(
        pushed.rejected.some((row) => row.tag === 'UnknownAttribute'),
        JSON.stringify(pushed),
      )
      yield* require(pushed.acked.length === 0, JSON.stringify(pushed))
      const facts = yield* committed(a, orgId(org))
      yield* require(
        facts.every((fact) => fact.a !== 'evidence/not-shipped'),
        JSON.stringify(facts),
      )
      return { tag: 'UnknownAttribute' }
    }),
  )

const staleLease = (directory: string, clock: MutableClock) =>
  session(directory, clock, 'fence', [
    ['a', 'p09-a'],
    ['b', 'p09-b'],
  ], (world) =>
    Effect.gen(function* () {
      const org = 'fence'
      const a = world.device('a')
      const b = world.device('b')
      const exec = executionId(org, 'one')
      const activity = activityId(org, 'one', 'work', 1)
      yield* selfCommit(a, {
        org,
        entity: exec,
        attribute: Attr.leaseHolder,
        value: encodeLease({ device: a.id, epoch: 1, expiresAtMs: null }),
        epoch: 1,
        command: 'workflow.lease',
      })
      yield* a.client.push(org)
      yield* selfCommit(b, {
        org,
        entity: exec,
        attribute: Attr.leaseHolder,
        value: encodeLease({ device: b.id, epoch: 2, expiresAtMs: null }),
        epoch: 2,
        command: 'workflow.lease',
      })
      yield* b.client.push(org)
      yield* selfCommit(a, {
        org,
        entity: activity,
        attribute: Attr.activityExit,
        value: encodeExit(Exit.succeed('stale')),
        epoch: 1,
        command: 'workflow.activity',
      })
      const rejected = yield* a.client.push(org)
      yield* require(
        rejected.rejected.some((row) => row.tag === 'StaleLease'),
        JSON.stringify(rejected),
      )
      yield* selfCommit(b, {
        org,
        entity: activity,
        attribute: Attr.activityExit,
        value: encodeExit(Exit.succeed('holder')),
        epoch: 2,
        command: 'workflow.activity',
      })
      const accepted = yield* b.client.push(org)
      yield* require(accepted.acked.length === 1, JSON.stringify(accepted))
      yield* a.client.pull(org)
      const rows = yield* a.store.scanPrefix(exec)
      const exits = rows.filter(
        (row) => row.e === activity && row.a === Attr.activityExit,
      )
      yield* require(exits.length === 1, JSON.stringify(exits))
      yield* require(
        exits[0]?.v === encodeExit(Exit.succeed('holder')),
        JSON.stringify(exits),
      )
      return { holder: b.id }
    }),
  )

const Approval = DurableDeferred.make('approval', {
  success: Schema.Boolean,
})

const Wait = Workflow.make('SyncDeferred.v1', {
  payload: { nonce: Schema.String },
  success: Schema.Struct({ ok: Schema.Boolean }),
  idempotencyKey: ({ nonce }: { nonce: string }) => `sync-deferred:${nonce}`,
  suspendedRetrySchedule: Schedule.spaced(Duration.millis(20)),
})

const waitLayer = Wait.toLayer(() =>
  Effect.gen(function* () {
    yield* DurableDeferred.await(Approval)
    return { ok: true }
  }),
)

const serverDeferred = (directory: string, clock: MutableClock) =>
  session(directory, clock, 'deferred', [['a', 'p09-wait']], (world) =>
    Effect.gen(function* () {
      const org = 'deferred'
      const a = world.device('a')
      const arrived = yield* Latch.make()
      const hook = Layer.succeed(
        CrashHook,
        CrashHook.of({
          at: (boundary) =>
            boundary === 'during-deferred' ? arrived.open : Effect.void,
        }),
      )
      const engineLive = waitLayer.pipe(
        Layer.provideMerge(engineLayer),
        Layer.provide(Layer.succeedContext(a.context)),
        Layer.provide(engineConfigLayer(org)),
        Layer.provide(deviceLayer(a.id)),
        Layer.provide(hook),
        Layer.provide(noopWakeScheduler),
      )
      const fiber = yield* Wait.execute({ nonce: 'one' }).pipe(
        Effect.provide(engineLive),
        Effect.forkChild,
      )
      yield* arrived.await
      const executionId = yield* Wait.executionId({ nonce: 'one' })
      yield* world.authority.completeDeferred({
        org,
        executionId,
        deferredName: 'approval',
        exit: encodeExit(Exit.succeed(true)),
      })
      yield* a.client.pull(org)
      const result = yield* Fiber.join(fiber).pipe(
        Effect.timeout(Duration.seconds(10)),
      )
      yield* require(result.ok === true, JSON.stringify(result))
      return { executionId }
    }),
  )

const fileManifest = (directory: string, clock: MutableClock) =>
  session(directory, clock, 'files', [
    ['a', 'p09-a'],
    ['b', 'p09-b'],
  ], (world) =>
    Effect.gen(function* () {
      const org = 'files'
      const a = world.device('a')
      const b = world.device('b')
      const text = 'p09-file'
      const hash = yield* blobHash(text)
      const entity = evidenceId(org, 'shot')
      const cs = yield* a.store.mint()
      const capturedTx = yield* a.store.mint()
      const memberTx = yield* a.store.mint()
      const commitTx = yield* a.store.mint()
      const captured: DatomType = {
        e: entity,
        a: Attr.captured,
        v: '1',
        tx: capturedTx,
        op: 'assert',
        cs,
      }
      const member: DatomType = {
        e: entity,
        a: Attr.evidenceFile,
        v: hash,
        tx: memberTx,
        op: 'assert',
        cs,
      }
      const hashed = yield* hashMembers([captured, member]).pipe(Effect.orDie)
      const changeset: Outgoing = {
        org,
        basis: 0,
        envelope: envelopeFor(cs, a.id, 'evidence.file', null),
        datoms: [
          captured,
          member,
          {
            e: cs,
            a: Attr.changesetCommit,
            v: encodeCommit({
              n: 2,
              hash: hashed,
              basis: 0,
              files: [hash],
            }),
            tx: commitTx,
            op: 'assert',
            cs,
          },
        ],
      }
      yield* a.client.submit(changeset)
      const waiting = yield* a.client.push(org)
      yield* require(waiting.waiting.length === 1, JSON.stringify(waiting))
      yield* require(waiting.acked.length === 0, JSON.stringify(waiting))
      yield* b.client.pull(org)
      const hidden = yield* committed(b, orgId(org))
      yield* require(
        valueOf(hidden, entity, Attr.evidenceFile) === undefined,
        `visible early ${JSON.stringify(hidden)}`,
      )
      const uploaded = yield* a.client.upload(org, text)
      yield* require(uploaded === hash, uploaded)
      const acked = yield* a.client.push(org)
      yield* require(acked.acked.length === 1, JSON.stringify(acked))
      yield* b.client.pull(org)
      const shown = yield* committed(b, orgId(org))
      yield* require(
        valueOf(shown, entity, Attr.evidenceFile) === hash,
        JSON.stringify(shown),
      )
      return { hash }
    }),
  )

export const runP09Checks = (
  directory: string,
  clock: MutableClock,
): Effect.Effect<CheckResult[], never, Scope.Scope> => {
  return Effect.all(
    [
      runCheck('outbox offline', outboxOffline(directory, clock)),
      runCheck('cursor stream', cursorStream(directory, clock)),
      runCheck('full organization', fullOrganization(directory, clock)),
      runCheck('duplicate append', duplicateAppend(directory, clock)),
      runCheck('typed rejection rebuilds', typedRejection(directory, clock)),
      runCheck('unknown attribute', unknownAttribute(directory, clock)),
      runCheck('stale lease rejected', staleLease(directory, clock)),
      runCheck('server deferred completion', serverDeferred(directory, clock)),
      runCheck('file manifest waits', fileManifest(directory, clock)),
    ],
    { concurrency: 1 },
  )
}

export const runP09 = (): Effect.Effect<CheckResult[], unknown> =>
  Effect.scoped(
    Effect.gen(function* () {
      const directory = yield* withTempDirectory('viviefs-p09-')
      const clock = makeMutableClock(1_700_000_000_000)
      return yield* runP09Checks(directory, clock)
    }),
  )
