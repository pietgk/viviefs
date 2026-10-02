import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Fiber from 'effect/Fiber'
import * as Layer from 'effect/Layer'
import * as Latch from 'effect/Latch'
import * as Schedule from 'effect/Schedule'
import * as Schema from 'effect/Schema'
import type * as Scope from 'effect/Scope'
import * as Tracer from 'effect/Tracer'
import * as DurableDeferred from 'effect/workflow/DurableDeferred'
import * as Workflow from 'effect/workflow/Workflow'
import { blobHash } from '@viviefs/blobs'
import {
  Attr,
  activityId,
  deviceLayer,
  encodeCommit,
  evidenceId,
  executionId,
  hashMembers,
  itemId,
  listId,
  orgId,
  type DatomType,
} from '@viviefs/datom'
import { renameList, sealItem } from '@viviefs/evidence-model'
import type { Outgoing } from '@viviefs/sync-client'
import { makeMutableClock, type MutableClock } from '@viviefs/datom/suites'
import type { CheckResult } from '@viviefs/testing'
import { withTempDirectory } from '@viviefs/testing/node'
import {
  CrashHook,
  encodeExit,
  encodeLease,
  engineConfigLayer,
  engineLayer,
  noopWakeScheduler,
} from '@viviefs/workflow-engine'
import {
  committed,
  envelopeFor,
  mint,
  personOf,
  require,
  runCheck,
  selfCommit,
  syncWorld,
  valueOf,
  type World,
} from './sync-world.ts'

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

// P09 checks run authenticated since P11: every device is a member of every
// organization these checks use. P11's own checks cover who may not.
const P09_ORGS = [
  'offline',
  'stream',
  'acme',
  'other',
  'dedup',
  'reject',
  'upgrade',
  'fence',
  'deferred',
  'files',
] as const

const session = <A>(
  directory: string,
  clock: MutableClock,
  prefix: string,
  devices: ReadonlyArray<readonly [string, string]>,
  use: (world: World) => Effect.Effect<A, unknown>,
) =>
  syncWorld(
    {
      directory,
      clock,
      prefix,
      devices: devices.map(([name, deviceId]) => ({
        name,
        deviceId,
        orgs: P09_ORGS,
      })),
    },
    use,
  )

/**
 * p09-check outboxOffline
 * `renameList` sets a list title and returns one changeset. Here the title is `local`. `submit` stores that changeset on A, so A's draft shows it and B's `pull` does not. After A pushes, the server has acked it, and B's next `pull` shows `local`.
 */
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
        actor: personOf(a),
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

/**
 * p09-check cursorStream
 * `renameList` creates two lists, `one` and `two`. One `pull` returns both. The next `pull` returns nothing new and keeps the same server cursor.
 */
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

/**
 * p09-check fullOrganization
 * A `renameList`s a list in organization `acme`. B `renameList`s a list in organization `other`. A's `pull` of `acme` shows `acme` and does not show `other`.
 */
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

/**
 * p09-check duplicateAppend
 * `renameList` sets the list title to `once` and returns one changeset. `submit` stores it on A. `push` sends it to the server, which acks it. `append` sends that same changeset again, with the same `tx`. The server acks and does not write a second title. B's `pull` shows the title once.
 */
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

/**
 * p09-check typedRejection
 * B `renameList`s the list to `box` and `sealItem` sets the item seal to `gold`. Both pushes ack. A then submits a `sealItem` of `silver` and a `renameList` to `kept`. One `push` rejects `silver` because the seal is write-once, rebuilds, and acks `kept`. The committed seal stays `gold`.
 */
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
        actor: personOf(a),
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

/**
 * p09-check unknownAttribute
 * The changeset asserts `evidence/not-shipped`, which is not in the catalog. The server rejects the whole changeset with `UnknownAttribute`. The attribute is not stored.
 */
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
        envelope: envelopeFor(tx, a, 'evidence.unknown', null),
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

/**
 * p09-check staleLease
 * A takes the lease at epoch 1. B takes it at epoch 2. A's activity exit at epoch 1 is rejected. B's exit at epoch 2 is acked. A's later `pull` shows only B's exit.
 */
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

/**
 * p09-check serverDeferred
 * The device runs a workflow that is waiting on a deferred. `completeDeferred` is the server writing that deferred's exit. The server does not run the workflow. The device `pull`s the exit and the workflow finishes.
 */
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
        Layer.provide(engineConfigLayer({ org, actor: personOf(a) })),
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

/**
 * p09-check fileManifest
 * The changeset names a file hash in its manifest. The server answers that the file is missing, so the push stays `waiting-file` and B does not see the file. After `upload`, the same changeset pushes and is acked. B's `pull` shows the hash.
 */
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
        envelope: envelopeFor(cs, a, 'evidence.file', null),
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

export const syncProtocolChecks = (
  directory: string,
  clock: MutableClock,
): Effect.Effect<CheckResult[], never, Scope.Scope> => {
  return Effect.all(
    [
      runCheck('P09', 'outbox offline', 'outboxOffline', outboxOffline(directory, clock)),
      runCheck('P09', 'cursor stream', 'cursorStream', cursorStream(directory, clock)),
      runCheck('P09', 
        'full organization',
        'fullOrganization',
        fullOrganization(directory, clock),
      ),
      runCheck('P09', 
        'duplicate append',
        'duplicateAppend',
        duplicateAppend(directory, clock),
      ),
      runCheck('P09', 
        'typed rejection rebuilds',
        'typedRejection',
        typedRejection(directory, clock),
      ),
      runCheck('P09', 
        'unknown attribute',
        'unknownAttribute',
        unknownAttribute(directory, clock),
      ),
      runCheck('P09', 
        'stale lease rejected',
        'staleLease',
        staleLease(directory, clock),
      ),
      runCheck('P09', 
        'server deferred completion',
        'serverDeferred',
        serverDeferred(directory, clock),
      ),
      runCheck('P09', 
        'file manifest waits',
        'fileManifest',
        fileManifest(directory, clock),
      ),
    ],
    { concurrency: 1 },
  )
}

export type P09Run = {
  readonly checks: ReadonlyArray<CheckResult>
  readonly spans: ReadonlyArray<Tracer.NativeSpan>
}

// Suspended so each run collects its own spans.
export const runSyncProtocolChecks: Effect.Effect<P09Run, unknown> = Effect.suspend(() => {
  const spans: Array<Tracer.NativeSpan> = []
  const tracer = Tracer.make({
    span(options) {
      const span = new Tracer.NativeSpan(options)
      spans.push(span)
      return span
    },
  })
  return Effect.scoped(
    Effect.gen(function* () {
      const directory = yield* withTempDirectory('viviefs-p09-')
      const clock = makeMutableClock(1_700_000_000_000)
      return yield* syncProtocolChecks(directory, clock)
    }),
  ).pipe(
    Effect.provideService(Tracer.Tracer, tracer),
    Effect.map((checks) => ({ checks, spans })),
  )
})
