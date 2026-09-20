import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Queue from 'effect/Queue'
import * as Reactivity from 'effect/unstable/reactivity/Reactivity'
import type * as SqlClient from 'effect/unstable/sql/SqlClient'
import {
  Attr,
  CHANGESET_TTL_MS,
  evidenceCatalog,
  evidenceId,
  encodeCommit,
  hashMembers,
  HlcClock,
  itemId,
  listId,
  LogStore,
  Projector,
  projectorLayer,
  keysOverlap,
  keysFor,
  type EnvelopeType,
} from '@viviefs/datom'
import {
  type CheckResult,
  type MutableClock,
} from './log-store-conformance.ts'

export const P05_CHECK_NAMES = [
  'incomplete changeset',
  'commit ordering',
  'cs equals tx',
  'abort',
  'expiry',
  'basis lww',
  'basis write-once',
  'basis human conflict',
  'defining attribute lifecycle',
  'prefix-id cascade',
  'orphan conflict',
  'reactivity keys',
  'rebuild equals incremental',
  'draft view',
] as const

export const P05_CHECK_COUNT = P05_CHECK_NAMES.length

const envelopeFor = (
  cs: string,
  actor = 'p05-actor',
): EnvelopeType => ({
  cs,
  actor,
  device: 'p05-device',
  leaseEpoch: null,
  traceId: 'cccccccccccccccccccccccccccccccc',
  spanId: 'dddddddddddddddd',
  sampled: false,
  command: 'p05.probe',
})

const runCheck = (
  name: string,
  eff: Effect.Effect<unknown, unknown>,
  timeout: `${number} seconds` = '30 seconds',
): Effect.Effect<CheckResult> =>
  eff.pipe(
    Effect.timeout(timeout),
    Effect.matchCause({
      onSuccess: (value) => ({
        name,
        status: 'PASS' as const,
        detail: JSON.stringify(value),
      }),
      onFailure: (cause) => ({
        name,
        status: 'FAIL' as const,
        detail: String(cause).split('\n').slice(0, 6).join(' | '),
      }),
    }),
  )

const valueOf = (
  facts: ReadonlyArray<{ e: string; a: string; v: string }>,
  entity: string,
  attribute: string,
): string | undefined =>
  facts.find((fact) => fact.e === entity && fact.a === attribute)?.v

export const runChangesetChecks = (
  storeLayer: Layer.Layer<LogStore | SqlClient.SqlClient, unknown, HlcClock>,
  clock: MutableClock,
): Effect.Effect<CheckResult[]> => {
  const layer = projectorLayer(evidenceCatalog).pipe(
    Layer.provideMerge(storeLayer),
    Layer.provideMerge(Reactivity.layer),
    Layer.provide(Layer.succeed(HlcClock, clock.service)),
  )
  const use = <A, E, R>(body: Effect.Effect<A, E, R>) =>
    body.pipe(Effect.provide(layer), Effect.scoped)

  const selfCommit = (
    entity: string,
    attribute: string,
    value: string,
    actor?: string,
  ) =>
    Effect.gen(function* () {
      const store = yield* LogStore
      const tx = yield* store.mint()
      yield* store.append(
        [{ e: entity, a: attribute, v: value, tx, op: 'assert', cs: tx }],
        envelopeFor(tx, actor),
      )
      return tx
    })

  const retract = (entity: string, attribute: string, value: string) =>
    Effect.gen(function* () {
      const store = yield* LogStore
      const tx = yield* store.mint()
      yield* store.append(
        [{ e: entity, a: attribute, v: value, tx, op: 'retract', cs: tx }],
        envelopeFor(tx),
      )
      return tx
    })

  const addMember = (
    cs: string,
    entity: string,
    attribute: string,
    value: string,
    actor?: string,
  ) =>
    Effect.gen(function* () {
      const store = yield* LogStore
      const tx = yield* store.mint()
      const datom = {
        e: entity,
        a: attribute,
        v: value,
        tx,
        op: 'assert' as const,
        cs,
      }
      yield* store.append([datom], envelopeFor(cs, actor))
      return datom
    })

  const basis = () =>
    Effect.gen(function* () {
      const store = yield* LogStore
      const rows = yield* store.streamFrom(0)
      return rows.at(-1)?.seq ?? 0
    })

  const commitOf = (
    cs: string,
    members: ReadonlyArray<{
      e: string
      a: string
      v: string
      tx: string
      op: 'assert' | 'retract'
      cs: string
    }>,
    at: number,
    actor?: string,
  ) =>
    Effect.gen(function* () {
      const store = yield* LogStore
      const hash = yield* hashMembers(members)
      const tx = yield* store.mint()
      yield* store.append(
        [
          {
            e: cs,
            a: Attr.changesetCommit,
            v: encodeCommit({ n: members.length, hash, basis: at, files: [] }),
            tx,
            op: 'assert',
            cs,
          },
        ],
        envelopeFor(cs, actor),
      )
      return tx
    })

  const abortOf = (cs: string) =>
    Effect.gen(function* () {
      const store = yield* LogStore
      const tx = yield* store.mint()
      yield* store.append(
        [
          {
            e: cs,
            a: Attr.changesetAbort,
            v: 'withdraw',
            tx,
            op: 'assert',
            cs,
          },
        ],
        envelopeFor(cs),
      )
      return tx
    })

  const ensureList = (org: string, list: string, title: string) =>
    Effect.gen(function* () {
      const entity = listId(org, list)
      const projector = yield* Projector
      yield* selfCommit(entity, Attr.list, list)
      yield* selfCommit(entity, Attr.listTitle, title)
      yield* projector.project()
      return entity
    })

  return Effect.gen(function* () {
    const checks: CheckResult[] = []

    checks.push(
      yield* runCheck(
        'incomplete changeset',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05a', '1', 'inbox')
            const item = itemId('p05a', '1', '9')
            const store = yield* LogStore
            const projector = yield* Projector
            const cs = yield* store.mint()
            const at = yield* basis()
            const one = yield* addMember(cs, item, Attr.item, '9')
            const two = yield* addMember(cs, item, Attr.itemTitle, 'draft')
            yield* projector.project()
            const hidden = yield* projector.facts({
              view: 'committed',
              prefix: item,
            })
            if (hidden.length !== 0) {
              throw new Error(`incomplete visible ${JSON.stringify(hidden)}`)
            }
            const three = yield* addMember(cs, item, Attr.itemSeal, 'sealed')
            yield* commitOf(cs, [one, two, three], at)
            yield* projector.project()
            const shown = yield* projector.facts({
              view: 'committed',
              prefix: item,
            })
            if (
              valueOf(shown, item, Attr.item) !== '9' ||
              valueOf(shown, item, Attr.itemTitle) !== 'draft' ||
              valueOf(shown, item, Attr.itemSeal) !== 'sealed'
            ) {
              throw new Error(`complete ${JSON.stringify(shown)}`)
            }
            return { list, item, members: shown.length }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'commit ordering',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05b', '1', 'start')
            const store = yield* LogStore
            const projector = yield* Projector
            const cs1 = yield* store.mint()
            const cs2 = yield* store.mint()
            const at = yield* basis()
            const early = yield* addMember(cs1, list, Attr.listTitle, 'early-member')
            const late = yield* addMember(cs2, list, Attr.listTitle, 'late-member')
            yield* commitOf(cs2, [late], at)
            yield* commitOf(cs1, [early], at)
            yield* projector.project()
            const facts = yield* projector.facts({
              view: 'committed',
              prefix: list,
            })
            if (valueOf(facts, list, Attr.listTitle) !== 'early-member') {
              throw new Error(`order ${JSON.stringify(facts)}`)
            }
            return { winner: 'early-member' }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'cs equals tx',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05c', '1', 'box')
            const projector = yield* Projector
            const tx = yield* selfCommit(list, Attr.listTitle, 'toggled')
            yield* projector.project()
            const facts = yield* projector.facts({
              view: 'committed',
              prefix: list,
            })
            if (valueOf(facts, list, Attr.listTitle) !== 'toggled') {
              throw new Error(`self ${JSON.stringify(facts)}`)
            }
            return { tx }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'abort',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05d', '1', 'box')
            const store = yield* LogStore
            const projector = yield* Projector
            const cs = yield* store.mint()
            const at = yield* basis()
            const member = yield* addMember(cs, list, Attr.listTitle, 'aborted')
            yield* abortOf(cs)
            yield* commitOf(cs, [member], at)
            yield* projector.project()
            const facts = yield* projector.facts({
              view: 'committed',
              prefix: list,
            })
            if (valueOf(facts, list, Attr.listTitle) === 'aborted') {
              throw new Error(`abort leaked ${JSON.stringify(facts)}`)
            }
            const statuses = yield* projector.statuses()
            if (!statuses.some((row) => row.cs === cs && row.status === 'aborted')) {
              throw new Error(`status ${JSON.stringify(statuses)}`)
            }
            return { cs }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'expiry',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05e', '1', 'box')
            const store = yield* LogStore
            const projector = yield* Projector
            const cs = yield* store.mint()
            const at = yield* basis()
            const member = yield* addMember(cs, list, Attr.listTitle, 'stale')
            clock.advance(CHANGESET_TTL_MS + 1)
            yield* commitOf(cs, [member], at)
            yield* projector.project()
            const facts = yield* projector.facts({
              view: 'committed',
              prefix: list,
            })
            if (valueOf(facts, list, Attr.listTitle) === 'stale') {
              throw new Error(`expired visible ${JSON.stringify(facts)}`)
            }
            const statuses = yield* projector.statuses()
            if (!statuses.some((row) => row.cs === cs && row.status === 'expired')) {
              throw new Error(`status ${JSON.stringify(statuses)}`)
            }
            return { ttlMs: CHANGESET_TTL_MS }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'basis lww',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05f', '1', 'v0')
            const store = yield* LogStore
            const projector = yield* Projector
            const staleBasis = yield* basis()
            yield* selfCommit(list, Attr.listTitle, 'v1')
            yield* projector.project()
            const cs = yield* store.mint()
            const member = yield* addMember(cs, list, Attr.listTitle, 'v2')
            yield* commitOf(cs, [member], staleBasis)
            yield* projector.project()
            const facts = yield* projector.facts({
              view: 'committed',
              prefix: list,
            })
            if (valueOf(facts, list, Attr.listTitle) !== 'v2') {
              throw new Error(`lww ${JSON.stringify(facts)}`)
            }
            return { winner: 'v2' }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'basis write-once',
        use(
          Effect.gen(function* () {
            yield* ensureList('p05g', '1', 'box')
            const item = itemId('p05g', '1', '1')
            const store = yield* LogStore
            const projector = yield* Projector
            const firstCs = yield* store.mint()
            const firstAt = yield* basis()
            const defining = yield* addMember(firstCs, item, Attr.item, '1')
            const title = yield* addMember(firstCs, item, Attr.itemTitle, 'one')
            const seal = yield* addMember(firstCs, item, Attr.itemSeal, 'first')
            yield* commitOf(firstCs, [defining, title, seal], firstAt)
            yield* projector.project()
            const accepted = yield* projector.facts({
              view: 'committed',
              prefix: item,
            })
            if (valueOf(accepted, item, Attr.itemSeal) !== 'first') {
              throw new Error(`first seal missing ${JSON.stringify(accepted)}`)
            }
            const secondCs = yield* store.mint()
            const secondAt = yield* basis()
            const retry = yield* addMember(secondCs, item, Attr.itemSeal, 'second')
            yield* commitOf(secondCs, [retry], secondAt)
            yield* projector.project()
            const after = yield* projector.facts({
              view: 'committed',
              prefix: item,
            })
            if (valueOf(after, item, Attr.itemSeal) !== 'first') {
              throw new Error(`write-once ${JSON.stringify(after)}`)
            }
            const statuses = yield* projector.statuses()
            if (
              !statuses.some(
                (row) => row.cs === secondCs && row.status === 'rejected',
              )
            ) {
              throw new Error(`reject ${JSON.stringify(statuses)}`)
            }
            return { accepted: 'first', rejected: secondCs }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'basis human conflict',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05h', '1', 'box')
            const ev = evidenceId('p05h', '1')
            const store = yield* LogStore
            const projector = yield* Projector
            const firstCs = yield* store.mint()
            const firstAt = yield* basis()
            const captured = yield* addMember(firstCs, ev, Attr.captured, '1')
            const owner = yield* addMember(firstCs, ev, Attr.evidenceOwner, list)
            const fileA = yield* addMember(firstCs, ev, Attr.evidenceFile, 'blob:a')
            yield* commitOf(firstCs, [captured, owner, fileA], firstAt)
            yield* projector.project()
            const secondCs = yield* store.mint()
            const fileB = yield* addMember(secondCs, ev, Attr.evidenceFile, 'blob:b')
            yield* commitOf(secondCs, [fileB], firstAt)
            yield* projector.project()
            const facts = yield* projector.facts({
              view: 'committed',
              prefix: ev,
            })
            const files = facts.filter((fact) => fact.a === Attr.evidenceFile)
            if (files.length !== 2) {
              throw new Error(`files ${JSON.stringify(files)}`)
            }
            const conflicts = yield* projector.conflicts()
            if (
              !conflicts.some(
                (row) => row.e === ev && row.a === Attr.evidenceFile,
              )
            ) {
              throw new Error(`no conflict ${JSON.stringify(conflicts)}`)
            }
            return { files: files.map((fact) => fact.v), conflicts: conflicts.length }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'defining attribute lifecycle',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05i', '1', 'box')
            const item = itemId('p05i', '1', '1')
            const store = yield* LogStore
            const projector = yield* Projector
            const cs = yield* store.mint()
            const at = yield* basis()
            const defining = yield* addMember(cs, item, Attr.item, '1')
            const title = yield* addMember(cs, item, Attr.itemTitle, 'keep')
            yield* commitOf(cs, [defining, title], at)
            yield* projector.project()
            yield* retract(item, Attr.item, '1')
            yield* projector.project()
            const hidden = yield* projector.facts({
              view: 'committed',
              prefix: item,
            })
            if (hidden.length !== 0) {
              throw new Error(`deleted visible ${JSON.stringify(hidden)}`)
            }
            yield* selfCommit(item, Attr.item, '1')
            yield* projector.project()
            const restored = yield* projector.facts({
              view: 'committed',
              prefix: item,
            })
            if (valueOf(restored, item, Attr.itemTitle) !== 'keep') {
              throw new Error(`restore ${JSON.stringify(restored)}`)
            }
            return { list, restored: true }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'prefix-id cascade',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05j', '1', 'box')
            const item = itemId('p05j', '1', '1')
            const store = yield* LogStore
            const projector = yield* Projector
            const cs = yield* store.mint()
            const at = yield* basis()
            const defining = yield* addMember(cs, item, Attr.item, '1')
            const title = yield* addMember(cs, item, Attr.itemTitle, 'child')
            yield* commitOf(cs, [defining, title], at)
            yield* projector.project()
            yield* retract(list, Attr.list, '1')
            yield* projector.project()
            const hidden = yield* projector.facts({
              view: 'committed',
              prefix: item,
            })
            if (hidden.length !== 0) {
              throw new Error(`cascade ${JSON.stringify(hidden)}`)
            }
            yield* selfCommit(list, Attr.list, '1')
            yield* projector.project()
            const shown = yield* projector.facts({
              view: 'committed',
              prefix: item,
            })
            if (valueOf(shown, item, Attr.itemTitle) !== 'child') {
              throw new Error(`restore cascade ${JSON.stringify(shown)}`)
            }
            return { child: 'child' }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'orphan conflict',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05k', '1', 'box')
            const projector = yield* Projector
            yield* retract(list, Attr.list, '1')
            yield* projector.project()
            const ev = evidenceId('p05k', '1')
            const store = yield* LogStore
            const cs = yield* store.mint()
            const at = yield* basis()
            const captured = yield* addMember(cs, ev, Attr.captured, '1')
            const owner = yield* addMember(cs, ev, Attr.evidenceOwner, list)
            const title = yield* addMember(cs, ev, Attr.evidenceTitle, 'photo')
            yield* commitOf(cs, [captured, owner, title], at)
            yield* projector.project()
            const conflicts = yield* projector.conflicts()
            const orphan = conflicts.filter((row) =>
              row.payload.includes('"kind":"orphan"'),
            )
            if (orphan.length === 0) {
              throw new Error(`silent loss ${JSON.stringify(conflicts)}`)
            }
            return { orphans: orphan.length }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'reactivity keys',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05l', '1', 'watch')
            const other = yield* ensureList('p05lother', '2', 'ignore')
            const projector = yield* Projector
            const matched = yield* projector
              .facts({ view: 'committed', prefix: list })
              .pipe(Reactivity.query(keysFor([list], [Attr.listTitle])))
            const unrelated = yield* projector
              .facts({ view: 'committed', prefix: other })
              .pipe(Reactivity.query(keysFor([other], [])))
            const first = yield* Queue.take(matched)
            const otherFirst = yield* Queue.take(unrelated)
            yield* selfCommit(list, Attr.listTitle, 'updated')
            yield* projector.project()
            const second = yield* Queue.take(matched)
            if (valueOf(second, list, Attr.listTitle) !== 'updated') {
              throw new Error(`matched ${JSON.stringify(second)}`)
            }
            const stale = yield* Queue.take(unrelated).pipe(
              Effect.timeout('200 millis'),
              Effect.option,
            )
            if (stale._tag === 'Some') {
              throw new Error(`unrelated reran ${JSON.stringify(stale.value)}`)
            }
            const invalidated = projector.lastKeys()
            if (!keysOverlap(keysFor([list], [Attr.listTitle]), invalidated)) {
              throw new Error(`keys ${JSON.stringify(invalidated)}`)
            }
            return {
              first: valueOf(first, list, Attr.listTitle),
              second: valueOf(second, list, Attr.listTitle),
              other: valueOf(otherFirst, other, Attr.listTitle),
            }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'rebuild equals incremental',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05m', '1', 'inc')
            const item = itemId('p05m', '1', '1')
            const store = yield* LogStore
            const projector = yield* Projector
            const cs = yield* store.mint()
            const at = yield* basis()
            const defining = yield* addMember(cs, item, Attr.item, '1')
            const title = yield* addMember(cs, item, Attr.itemTitle, 'row')
            yield* commitOf(cs, [defining, title], at)
            yield* projector.project()
            yield* selfCommit(list, Attr.listTitle, 'after')
            yield* projector.project()
            const incremental = yield* projector.snapshot()
            yield* projector.rebuild()
            const rebuilt = yield* projector.snapshot()
            if (incremental !== rebuilt) {
              throw new Error('rebuild diverged from incremental')
            }
            return { bytes: incremental.length }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'draft view',
        use(
          Effect.gen(function* () {
            const list = yield* ensureList('p05n', '1', 'public')
            const store = yield* LogStore
            const projector = yield* Projector
            const cs = yield* store.mint()
            yield* addMember(cs, list, Attr.listTitle, 'mine', 'author-a')
            yield* projector.project()
            const committed = yield* projector.facts({
              view: 'committed',
              prefix: list,
            })
            const author = yield* projector.facts({
              view: 'draft',
              actor: 'author-a',
              prefix: list,
            })
            const other = yield* projector.facts({
              view: 'draft',
              actor: 'author-b',
              prefix: list,
            })
            if (valueOf(committed, list, Attr.listTitle) !== 'public') {
              throw new Error(`committed ${JSON.stringify(committed)}`)
            }
            if (valueOf(author, list, Attr.listTitle) !== 'mine') {
              throw new Error(`author ${JSON.stringify(author)}`)
            }
            if (valueOf(other, list, Attr.listTitle) !== 'public') {
              throw new Error(`other ${JSON.stringify(other)}`)
            }
            return { draft: 'mine' }
          }),
        ),
      ),
    )

    return checks
  })
}
