import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import {
  APPEND_VOLUME,
  FUTURE_SKEW_MS,
  HlcClock,
  LogStore,
  compareHlc,
  decodeHlc,
  encodeHlc,
  fingerprintDevice,
  type EnvelopeType,
  type StoredDatom,
} from '../index.ts'
import type { CheckResult } from '@viviefs/testing'
import type * as SqlClient from 'effect/sql/SqlClient'

export const P04_CHECK_NAMES = [
  'append',
  'duplicate append',
  'acceptance time',
  'hlc mint',
  'hlc backwards clock',
  'hlc reboot',
  'hlc remote-ahead',
  'hlc future skew',
  'cursor streaming',
  'prefix scans',
  'acknowledged cursor',
  'volume',
] as const

export const P04_CHECK_COUNT = P04_CHECK_NAMES.length

export type MutableClock = {
  readonly service: HlcClock['Service']
  wall: () => number
  monotonic: () => number
  setWall: (ms: number) => void
  setMonotonic: (ms: number) => void
  advance: (ms: number) => void
}

export const makeMutableClock = (wallMs: number): MutableClock => {
  let wall = wallMs
  let mono = 0
  return {
    service: HlcClock.of({
      wallMs: () => wall,
      monotonicMs: () => mono,
    }),
    wall: () => wall,
    monotonic: () => mono,
    setWall: (ms) => {
      wall = ms
    },
    setMonotonic: (ms) => {
      mono = ms
    },
    advance: (ms) => {
      wall += ms
      mono += ms
    },
  }
}

const envelopeFor = (cs: string): EnvelopeType => ({
  cs,
  actor: 'p04-actor',
  device: 'p04-device',
  leaseEpoch: null,
  traceId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  spanId: 'bbbbbbbbbbbbbbbb',
  sampled: false,
  command: 'p04.probe',
  acceptedAt: null,
})

const selfCommitted = (e: string, v: string, tx: string) => ({
  e,
  a: 'p04.title',
  v,
  tx,
  op: 'assert' as const,
  cs: tx,
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
        detail: String(cause).split('\n').slice(0, 4).join(' | '),
      }),
    }),
  )

export const runLogStoreChecks = (
  storeLayer: Layer.Layer<LogStore | SqlClient.SqlClient, unknown, HlcClock>,
  clock: MutableClock,
): Effect.Effect<CheckResult[]> => {
  const layer = storeLayer.pipe(Layer.provide(Layer.succeed(HlcClock, clock.service)))
  const use = <A, E>(body: Effect.Effect<A, E, LogStore>) =>
    body.pipe(Effect.provide(layer), Effect.scoped)

  return Effect.gen(function* () {
    const checks: CheckResult[] = []

    checks.push(
      yield* runCheck(
        'append',
        use(
          Effect.gen(function* () {
            const store = yield* LogStore
            const tx = yield* store.mint()
            const result = yield* store.append(
              [selfCommitted('Oprobe/Lappend', 'one', tx)],
              envelopeFor(tx),
            )
            if (result.inserted !== 1 || result.duplicates !== 0) {
              throw new Error(`append ${JSON.stringify(result)}`)
            }
            const rows = yield* store.streamFrom(0)
            const written = rows.filter((row) => row.tx === tx)
            if (written.length !== 1 || written[0]?.e !== 'Oprobe/Lappend') {
              throw new Error(`stream ${JSON.stringify(written)}`)
            }
            const stored = yield* store.envelope(tx)
            const expected = envelopeFor(tx)
            if (JSON.stringify(stored) !== JSON.stringify(expected)) {
              throw new Error(`envelope ${JSON.stringify(stored)}`)
            }
            if ((yield* store.envelope('missing')) !== null) {
              throw new Error('envelope for an unknown cs is not null')
            }
            return { tx, seq: written[0]?.seq }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'duplicate append',
        use(
          Effect.gen(function* () {
            const store = yield* LogStore
            const tx = yield* store.mint()
            const datom = selfCommitted('Oprobe/Ldup', 'once', tx)
            const first = yield* store.append([datom], envelopeFor(tx))
            const duplicate = yield* store.append([datom], envelopeFor(tx))
            const tx2 = yield* store.mint()
            const fresh = yield* store.append(
              [selfCommitted('Oprobe/Ldup', 'two', tx2)],
              envelopeFor(tx2),
            )
            if (first.inserted !== 1 || duplicate.inserted !== 0 || duplicate.duplicates !== 1) {
              throw new Error(
                `duplicate control ${JSON.stringify({ first, duplicate })}`,
              )
            }
            if (fresh.inserted !== 1) {
              throw new Error(`new tx not appended ${JSON.stringify(fresh)}`)
            }
            const rows = yield* store.streamFrom(0)
            const copies = rows.filter((row) => row.tx === tx)
            if (copies.length !== 1) {
              throw new Error(`duplicate stored ${copies.length} time(s)`)
            }
            if (!rows.some((row) => row.tx === tx2)) {
              throw new Error('new tx missing after duplicate')
            }
            return { duplicates: duplicate.duplicates, insertedNew: fresh.inserted }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'acceptance time',
        use(
          Effect.gen(function* () {
            const store = yield* LogStore
            const tx = yield* store.mint()
            const datom = selfCommitted('Oprobe/Laccepted', 'one', tx)
            const local = envelopeFor(tx)
            yield* store.append([datom], local)
            const before = (yield* store.envelope(tx))?.acceptedAt
            yield* store.append([datom], { ...local, acceptedAt: 1_000 })
            const filled = (yield* store.envelope(tx))?.acceptedAt
            yield* store.append([datom], { ...local, acceptedAt: 2_000 })
            yield* store.append([datom], local)
            const kept = (yield* store.envelope(tx))?.acceptedAt
            if (before !== null || filled !== 1_000 || kept !== 1_000) {
              throw new Error(
                `acceptedAt ${JSON.stringify({ before, filled, kept })}`,
              )
            }
            return { before, filled, kept }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'hlc mint',
        use(
          Effect.gen(function* () {
            const store = yield* LogStore
            const first = yield* store.mint()
            const second = yield* store.mint()
            const left = decodeHlc(first)
            const right = decodeHlc(second)
            if (!left || !right) throw new Error('decode mint')
            if (compareHlc(right, left) <= 0 || !(first < second)) {
              throw new Error(`mint order ${first} ${second}`)
            }
            if (left.pt === right.pt && right.c !== left.c + 1) {
              throw new Error(`counter ${left.c} -> ${right.c}`)
            }
            return { first, second }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'hlc backwards clock',
        use(
          Effect.gen(function* () {
            const store = yield* LogStore
            const first = yield* store.mint()
            clock.advance(20)
            const beforeJump = yield* store.mint()
            clock.setWall(clock.wall() - 60_000)
            const afterJump = yield* store.mint()
            if (!(first < beforeJump) || !(beforeJump < afterJump)) {
              throw new Error(`backwards wall ${first} ${beforeJump} ${afterJump}`)
            }
            return { first, beforeJump, afterJump }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'hlc reboot',
        Effect.gen(function* () {
          const first = yield* use(
            Effect.gen(function* () {
              const store = yield* LogStore
              return yield* store.mint()
            }),
          )
          clock.setWall(clock.wall() - 120_000)
          clock.setMonotonic(0)
          const afterReboot = yield* use(
            Effect.gen(function* () {
              const store = yield* LogStore
              return yield* store.mint()
            }),
          )
          const left = decodeHlc(first)
          const right = decodeHlc(afterReboot)
          if (!left || !right || compareHlc(right, left) <= 0) {
            throw new Error(`reboot ${first} ${afterReboot}`)
          }
          return { first, afterReboot }
        }),
      ),
    )

    checks.push(
      yield* runCheck(
        'hlc remote-ahead',
        use(
          Effect.gen(function* () {
            const store = yield* LogStore
            const remote = encodeHlc(
              clock.wall() + 1_000,
              0,
              fingerprintDevice('remote-device'),
              7,
            )
            yield* store.receive(remote)
            const next = yield* store.mint()
            const parts = decodeHlc(next)
            const remoteParts = decodeHlc(remote)
            if (!parts || !remoteParts || compareHlc(parts, remoteParts) <= 0) {
              throw new Error(`remote-ahead ${remote} ${next}`)
            }
            return { remote, next }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'hlc future skew',
        use(
          Effect.gen(function* () {
            const store = yield* LogStore
            const local = yield* store.mint()
            const parts = decodeHlc(local)
            if (!parts) throw new Error('decode local mint')
            const remote = encodeHlc(
              parts.pt + FUTURE_SKEW_MS + 1,
              0,
              fingerprintDevice('skew-device'),
              3,
            )
            const failed = yield* store.receive(remote).pipe(Effect.flip)
            if (failed._tag !== 'FutureSkew') {
              throw new Error(`expected FutureSkew, got ${String(failed)}`)
            }
            const tx = yield* store.mint()
            const result = yield* store.append(
              [selfCommitted('Oprobe/Lskew', 'ok', tx)],
              envelopeFor(tx),
            )
            if (result.inserted !== 1) {
              throw new Error('store unusable after skew reject')
            }
            return { boundMs: FUTURE_SKEW_MS, minted: tx }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'cursor streaming',
        use(
          Effect.gen(function* () {
            const store = yield* LogStore
            const txs = [
              yield* store.mint(),
              yield* store.mint(),
              yield* store.mint(),
            ]
            for (const [index, tx] of txs.entries()) {
              yield* store.append(
                [selfCommitted(`Oprobe/Lcur/${index}`, `c${index}`, tx)],
                envelopeFor(tx),
              )
            }
            const all = yield* store.streamFrom(0)
            const matching = all.filter((row) => row.e.startsWith('Oprobe/Lcur/'))
            if (matching.length !== 3) {
              throw new Error(`cursor all ${JSON.stringify(matching)}`)
            }
            const rest = yield* store.streamFrom(matching[0]?.seq ?? 0)
            const restCur = rest.filter((row) => row.e.startsWith('Oprobe/Lcur/'))
            if (restCur.length !== 2 || restCur[0]?.seq <= (matching[0]?.seq ?? 0)) {
              throw new Error(`cursor rest ${JSON.stringify(restCur)}`)
            }
            const first = matching[0]
            const limited = yield* store.streamFrom((first?.seq ?? 1) - 1, 2)
            if (limited.length !== 2 || limited[0]?.seq !== first?.seq) {
              throw new Error(`cursor limit ${JSON.stringify(limited)}`)
            }
            return { all: matching.length, rest: restCur.length, limited: limited.length }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'prefix scans',
        use(
          Effect.gen(function* () {
            const store = yield* LogStore
            const one = yield* store.mint()
            const two = yield* store.mint()
            const other = yield* store.mint()
            yield* store.append(
              [selfCommitted('Oprobe/Lpre/1', 'a', one)],
              envelopeFor(one),
            )
            yield* store.append(
              [selfCommitted('Oprobe/Lpre/2', 'b', two)],
              envelopeFor(two),
            )
            yield* store.append(
              [selfCommitted('Oother/Lpre/1', 'c', other)],
              envelopeFor(other),
            )
            const found = yield* store.scanPrefix('Oprobe/Lpre/')
            if (found.length !== 2 || found.some((row) => row.e.startsWith('Oother/'))) {
              throw new Error(`prefix ${JSON.stringify(found)}`)
            }
            return { count: found.length }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'acknowledged cursor',
        use(
          Effect.gen(function* () {
            const store = yield* LogStore
            const reader = 'trace/probe'
            const txs = [yield* store.mint(), yield* store.mint(), yield* store.mint(), yield* store.mint()]
            for (const [index, tx] of txs.entries()) {
              yield* store.append([selfCommitted(`Oprobe/Lack/${index}`, `a${index}`, tx)], envelopeFor(tx))
            }
            const ours = (rows: ReadonlyArray<StoredDatom>) => rows.filter((row) => row.e.startsWith('Oprobe/Lack/'))
            const all = ours(yield* store.streamFrom(0))
            const second = all[1]
            if (!second) throw new Error('missing acknowledged cursor rows')
            if ((yield* store.acknowledged(reader)) !== null) {
              throw new Error(`${reader} has a place before it acknowledged`)
            }
            yield* store.acknowledge(reader, second.seq)
            const place = yield* store.acknowledged(reader)
            if (place !== second.seq) throw new Error(`acknowledged ${place}, expected ${second.seq}`)
            const after = ours(yield* store.streamFrom(place))
            if (after.map((row) => row.tx).join() !== all.slice(2).map((row) => row.tx).join()) {
              throw new Error(`read on from its place: ${JSON.stringify(after)}`)
            }
            const last = all.at(-1)?.seq ?? 0
            yield* store.acknowledge(reader, last)
            if ((yield* store.acknowledged(reader)) !== last) throw new Error('acknowledged cursor did not move')
            const kept = ours(yield* store.streamFrom(0))
            if (kept.length !== all.length) throw new Error(`acknowledging removed facts: ${kept.length} of ${all.length}`)
            return { place: second.seq, last, kept: kept.length }
          }),
        ),
      ),
    )

    checks.push(
      yield* runCheck(
        'volume',
        use(
          Effect.gen(function* () {
            const store = yield* LogStore
            const cs = yield* store.mint()
            const members = []
            for (let index = 0; index < APPEND_VOLUME; index++) {
              const tx = yield* store.mint()
              members.push({
                e: `Ovol/E${index}`,
                a: 'p04.payload',
                v: `v-${index}`,
                tx,
                op: 'assert' as const,
                cs,
              })
              if (index % 50 === 49) {
                yield* Effect.sleep('1 millis')
              }
            }
            const written = yield* store.append(members, envelopeFor(cs))
            if (written.inserted !== APPEND_VOLUME) {
              throw new Error(`volume insert ${JSON.stringify(written)}`)
            }
            const found = yield* store.scanPrefix('Ovol/E42')
            if (found[0]?.v !== 'v-42') {
              throw new Error(`volume lookup ${JSON.stringify(found)}`)
            }
            return { volume: APPEND_VOLUME, found: found[0]?.e }
          }),
        ),
        '120 seconds',
      ),
    )

    return checks
  })
}
