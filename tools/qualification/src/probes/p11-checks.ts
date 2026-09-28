/**
 * P11 Node checks (ADR-0022, design review section 1). Every check runs on
 * the authenticated sync protocol with a fake issuer: device `a` is a member
 * of `acme`, device `b` of `other`. Where a check refuses something it also
 * shows the same thing allowed for someone entitled to it, so a server that
 * refuses everything fails.
 */
import * as Clock from 'effect/Clock'
import * as Effect from 'effect/Effect'
import type * as Scope from 'effect/Scope'
import * as Tracer from 'effect/Tracer'
import { blobHash } from '@viviefs/blobs'
import {
  ACCOUNT_ROOT,
  Attr,
  accountId,
  encodeCommit,
  evidenceId,
  executionId,
  hashMembers,
  membershipId,
  type DatomType,
} from '@viviefs/datom'
import { renameList } from '@viviefs/evidence-model'
import { SignInNeeded } from '@viviefs/identity'
import type { Outgoing } from '@viviefs/sync-client'
import {
  makeMutableClock,
  type CheckResult,
  type MutableClock,
} from '@viviefs/testing'
import { tokenSignInSession } from '@viviefs/testing/identity'
import { withTempDirectory } from '@viviefs/testing/node'
import { encodeExit, encodeLease } from '@viviefs/workflow-engine'
import * as Exit from 'effect/Exit'
import {
  envelopeFor,
  mint,
  personOf,
  require,
  runCheck,
  selfCommit,
  syncWorld,
  type Device,
  type DeviceSpec,
  type World,
} from './sync-world.ts'

export const P11_NODE_CHECK_NAMES = [
  'cross-organization denied',
  'never granted',
  'lease',
  'actor',
  'server-only attributes',
  'server-only root',
  'revocation',
  'acceptance time',
  'blobs per organization',
  'missing token',
  'sign-in needed keeps outbox',
  'caller statement',
] as const

export const P11_NODE_CHECK_COUNT = P11_NODE_CHECK_NAMES.length

const ACME = 'acme'
const OTHER = 'other'

/** The outcome of an RPC as a tag: `ok`, or the error's `_tag`. */
const outcome = <A, E extends { readonly _tag: string }, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<string, never, R> =>
  Effect.match(effect, {
    onSuccess: () => 'ok',
    onFailure: (error) => error._tag,
  })

const world = <A>(
  directory: string,
  clock: MutableClock,
  prefix: string,
  devices: ReadonlyArray<DeviceSpec>,
  use: (world: World) => Effect.Effect<A, unknown>,
) => syncWorld({ directory, clock, prefix, devices }, use)

const members: ReadonlyArray<DeviceSpec> = [
  { name: 'a', deviceId: 'p11-a', orgs: [ACME] },
  { name: 'b', deviceId: 'p11-b', orgs: [OTHER] },
]

const titled = (device: Device, org: string, list: string, title: string) =>
  Effect.gen(function* () {
    return yield* renameList(
      { title: null },
      { org, list, title },
      yield* mint(device, 0),
    )
  })

/** Completes the `approval` deferred of execution `one` over the raw RPC. */
const approve = (device: Device, org: string) =>
  device.raw
    .CompleteDeferred({
      org,
      executionId: 'one',
      deferredName: 'approval',
      exit: encodeExit(Exit.succeed(true)),
    })
    .pipe(
      Effect.withSpan('SyncRpc.completeDeferred', {
        attributes: { 'sync.device': device.id },
      }),
    )

const outboxStates = (device: Device) =>
  device.sql<{ cs: string; state: string; rejection: string | null }>`
    SELECT cs, state, rejection FROM outbox ORDER BY id
  `

/**
 * p11-check crossOrganization
 * The positive control. A pushes a list title to `acme`, its own organization, and the server acks. The same token asking for `other` gets `MembershipMissing` on `Append`, `Pull`, `PutBlob` and `CompleteDeferred`. B, a member of `other`, completes a deferred there.
 */
const crossOrganization = (directory: string, clock: MutableClock) =>
  world(directory, clock, 'cross', members, (w) =>
    Effect.gen(function* () {
      const a = w.device('a')
      const b = w.device('b')
      yield* a.client.submit(yield* titled(a, ACME, 'one', 'mine'))
      const own = yield* a.client.push(ACME)
      yield* require(own.acked.length === 1, JSON.stringify(own))
      const foreign = yield* titled(a, OTHER, 'one', 'theirs')
      const text = 'p11-cross'
      const denied = {
        append: yield* outcome(a.rpc.append(foreign)),
        pull: yield* outcome(a.rpc.pull({ org: OTHER, cursor: 0 })),
        putBlob: yield* outcome(
          a.rpc.putBlob({ org: OTHER, hash: yield* blobHash(text), text }),
        ),
        completeDeferred: yield* outcome(approve(a, OTHER)),
      }
      yield* require(
        Object.values(denied).every((tag) => tag === 'MembershipMissing'),
        JSON.stringify(denied),
      )
      const allowed = yield* outcome(approve(b, OTHER))
      yield* require(allowed === 'ok', allowed)
      return { ...denied, sameOrganization: allowed }
    }),
  )

/**
 * p11-check neverGranted
 * C signs in with a valid token but was never granted membership anywhere, so it has no person. Its `pull` of `acme` gets `MembershipMissing`, and the server mints no person for it.
 */
const neverGranted = (directory: string, clock: MutableClock) =>
  world(
    directory,
    clock,
    'never',
    [...members, { name: 'c', deviceId: 'p11-c', orgs: [] }],
    (w) =>
      Effect.gen(function* () {
        const c = w.device('c')
        const pulled = yield* outcome(c.client.pull(ACME))
        yield* require(pulled === 'MembershipMissing', pulled)
        const person = yield* w.memberships.personOf(w.issuer.account('p11-c'))
        yield* require(person === null, `minted ${person}`)
        return { pull: pulled, person }
      }),
  )

/**
 * p11-check lease
 * B is not a member of `acme`. Its lease on an `acme` execution is rejected with `MembershipMissing`. A, a member, takes the same lease and the server acks. The server holds only A's lease.
 */
const lease = (directory: string, clock: MutableClock) =>
  world(directory, clock, 'lease', members, (w) =>
    Effect.gen(function* () {
      const a = w.device('a')
      const b = w.device('b')
      const exec = executionId(ACME, 'one')
      const take = (device: Device) =>
        selfCommit(device, {
          org: ACME,
          entity: exec,
          attribute: Attr.leaseHolder,
          value: encodeLease({ device: device.id, epoch: 1, expiresAtMs: null }),
          epoch: 1,
          command: 'workflow.lease',
        })
      yield* take(b)
      const foreign = yield* b.client.push(ACME)
      yield* require(
        foreign.rejected.some((row) => row.tag === 'MembershipMissing'),
        JSON.stringify(foreign),
      )
      yield* take(a)
      const own = yield* a.client.push(ACME)
      yield* require(own.acked.length === 1, JSON.stringify(own))
      const holders = (yield* w.server.scanPrefix(exec)).filter(
        (row) => row.a === Attr.leaseHolder,
      )
      yield* require(
        holders.length === 1 && holders[0]?.v.includes('p11-a') === true,
        JSON.stringify(holders),
      )
      return { foreign: 'MembershipMissing', holders: holders.length }
    }),
  )

/**
 * p11-check actor
 * A sends a changeset whose envelope names B's person, then one that names `server`. Both get `ActorMismatch`. The same changeset naming A's own person is acked.
 */
const actor = (directory: string, clock: MutableClock) =>
  world(directory, clock, 'actor', members, (w) =>
    Effect.gen(function* () {
      const a = w.device('a')
      const b = w.device('b')
      const claim = (name: string, list: string) =>
        Effect.gen(function* () {
          const changeset = yield* titled(a, ACME, list, 'claimed')
          return yield* outcome(
            a.rpc.append({
              ...changeset,
              envelope: { ...changeset.envelope, actor: name },
            }),
          )
        })
      const asB = yield* claim(personOf(b), 'b')
      const asServer = yield* claim('server', 'server')
      const asSelf = yield* claim(personOf(a), 'self')
      yield* require(
        asB === 'ActorMismatch' && asServer === 'ActorMismatch' && asSelf === 'ok',
        JSON.stringify({ asB, asServer, asSelf }),
      )
      return { asB, asServer, asSelf }
    }),
  )

const selfCommitted = (
  device: Device,
  org: string,
  datom: Omit<DatomType, 'tx' | 'cs' | 'op'>,
) =>
  Effect.map(device.store.mint(), (tx): Outgoing => ({
    org,
    basis: 0,
    envelope: envelopeFor(tx, device, 'p11.claim', null),
    datoms: [{ ...datom, tx, op: 'assert', cs: tx }],
  }))

/**
 * p11-check serverOnlyAttributes
 * A tries to grant B membership of `acme` by writing the membership datom itself. The server answers `ServerOnlyAttribute`, and B's person is still not a member.
 */
const serverOnlyAttributes = (directory: string, clock: MutableClock) =>
  world(directory, clock, 'server-only', members, (w) =>
    Effect.gen(function* () {
      const a = w.device('a')
      const b = w.device('b')
      const person = personOf(b)
      const grant = yield* outcome(
        a.rpc.append(
          yield* selfCommitted(a, ACME, {
            e: membershipId(ACME, person),
            a: Attr.membershipGranted,
            v: person,
          }),
        ),
      )
      yield* require(grant === 'ServerOnlyAttribute', grant)
      const member = yield* w.memberships.isMember(person, ACME)
      yield* require(member === false, 'B became a member')
      return { grant, member }
    }),
  )

/**
 * p11-check serverOnlyRoot
 * A's `pull` of `acme` holds its own membership and no account datom, so no provider subject reaches a device. A changeset that writes an account entity gets `ServerOnlyAttribute`.
 */
const serverOnlyRoot = (directory: string, clock: MutableClock) =>
  world(directory, clock, 'root', members, (w) =>
    Effect.gen(function* () {
      const a = w.device('a')
      yield* a.client.pull(ACME)
      const rows = yield* a.store.streamFrom(0)
      const membership = rows.some(
        (row) =>
          row.e === membershipId(ACME, personOf(a)) &&
          row.a === Attr.membershipGranted,
      )
      const accounts = rows.filter(
        (row) =>
          row.e.startsWith(ACCOUNT_ROOT) || row.a.startsWith('viviefs/account/'),
      )
      yield* require(membership, 'own membership missing on the device')
      yield* require(accounts.length === 0, JSON.stringify(accounts))
      const link = yield* outcome(
        a.rpc.append(
          yield* selfCommitted(a, ACME, {
            e: yield* accountId(w.issuer.account('p11-intruder')),
            a: Attr.accountPerson,
            v: personOf(a),
          }),
        ),
      )
      yield* require(link === 'ServerOnlyAttribute', link)
      return { membership, accounts: accounts.length, link }
    }),
  )

/**
 * p11-check revocation
 * A has an unsent title when the operator revokes its membership; its token is still valid. The next `push` rejects the row with `MembershipMissing` and keeps it in the outbox. A new local change is refused. After a new grant, a `pull` succeeds and A can change `acme` again.
 */
const revocation = (directory: string, clock: MutableClock) =>
  world(directory, clock, 'revoke', members, (w) =>
    Effect.gen(function* () {
      const a = w.device('a')
      const account = w.issuer.account('p11-a')
      yield* a.client.submit(yield* titled(a, ACME, 'one', 'before'))
      yield* w.memberships.revoke(ACME, account)
      const pushed = yield* a.client.push(ACME)
      yield* require(
        pushed.rejected.length === 1 &&
          pushed.rejected[0]?.tag === 'MembershipMissing',
        JSON.stringify(pushed),
      )
      const kept = yield* outboxStates(a)
      yield* require(
        kept.length === 1 && kept[0]?.state === 'rejected',
        JSON.stringify(kept),
      )
      const readOnly = yield* outcome(
        a.client.submit(yield* titled(a, ACME, 'two', 'after')),
      )
      yield* require(readOnly === 'MembershipMissing', readOnly)
      yield* w.memberships.grant(ACME, account)
      yield* a.client.pull(ACME)
      yield* a.client.submit(yield* titled(a, ACME, 'three', 'again'))
      const again = yield* a.client.push(ACME)
      yield* require(again.acked.length === 1, JSON.stringify(again))
      return { rejected: 'MembershipMissing', kept: kept.length, readOnly }
    }),
  )

/**
 * p11-check acceptanceTime
 * A submits a changeset that claims the server already accepted it at `5`. The outbox and A's log hold no acceptance time. The server stamps its own clock when it acks, and after the push A's log holds the server's value.
 */
const acceptanceTime = (directory: string, clock: MutableClock) =>
  world(directory, clock, 'accepted', members, (w) =>
    Effect.gen(function* () {
      const a = w.device('a')
      const changeset = yield* titled(a, ACME, 'one', 'stamped')
      const cs = changeset.envelope.cs
      yield* a.client.submit({
        ...changeset,
        envelope: { ...changeset.envelope, acceptedAt: 5 },
      })
      const local = (yield* a.store.envelope(cs))?.acceptedAt
      const [row] = yield* a.sql<{ payload: string }>`
        SELECT payload FROM outbox WHERE cs = ${cs}
      `
      const queued = JSON.parse(row?.payload ?? '{}').envelope?.acceptedAt
      yield* require(local === null && queued === null, JSON.stringify({ local, queued }))
      const before = yield* Clock.currentTimeMillis
      yield* a.client.push(ACME)
      const after = yield* Clock.currentTimeMillis
      const server = (yield* w.server.envelope(cs))?.acceptedAt ?? null
      const device = (yield* a.store.envelope(cs))?.acceptedAt ?? null
      yield* require(
        server !== null && server >= before && server <= after,
        JSON.stringify({ server, before, after }),
      )
      yield* require(device === server, JSON.stringify({ device, server }))
      return { claimed: 5, withinPush: server !== null, deviceMatches: device === server }
    }),
  )

/**
 * p11-check blobsPerOrganization
 * A uploads a file to `acme`. B names the same hash in a changeset for `other`: the server answers `FileMissing`, because `acme`'s copy is not `other`'s. After B uploads the file to `other`, the same changeset is acked. A cannot upload to `other`.
 */
const blobsPerOrganization = (directory: string, clock: MutableClock) =>
  world(directory, clock, 'blobs', members, (w) =>
    Effect.gen(function* () {
      const a = w.device('a')
      const b = w.device('b')
      const text = 'p11-file'
      const hash = yield* a.client.upload(ACME, text)
      const entity = evidenceId(OTHER, 'shot')
      const cs = yield* b.store.mint()
      const captured: DatomType = {
        e: entity,
        a: Attr.captured,
        v: '1',
        tx: yield* b.store.mint(),
        op: 'assert',
        cs,
      }
      const file: DatomType = {
        e: entity,
        a: Attr.evidenceFile,
        v: hash,
        tx: yield* b.store.mint(),
        op: 'assert',
        cs,
      }
      const hashed = yield* hashMembers([captured, file]).pipe(Effect.orDie)
      yield* b.client.submit({
        org: OTHER,
        basis: 0,
        envelope: envelopeFor(cs, b, 'evidence.file', null),
        datoms: [
          captured,
          file,
          {
            e: cs,
            a: Attr.changesetCommit,
            v: encodeCommit({ n: 2, hash: hashed, basis: 0, files: [hash] }),
            tx: yield* b.store.mint(),
            op: 'assert',
            cs,
          },
        ],
      })
      const waiting = yield* b.client.push(OTHER)
      yield* require(waiting.waiting.length === 1, JSON.stringify(waiting))
      yield* b.client.upload(OTHER, text)
      const acked = yield* b.client.push(OTHER)
      yield* require(acked.acked.length === 1, JSON.stringify(acked))
      const foreign = yield* outcome(a.client.upload(OTHER, text))
      yield* require(foreign === 'MembershipMissing', foreign)
      return { otherBeforeUpload: 'FileMissing', foreign }
    }),
  )

const sessionWith = (accessToken: Effect.Effect<string, SignInNeeded>) => () =>
  tokenSignInSession(accessToken)

/**
 * p11-check missingToken
 * D sends no token and E sends a string that is not a token, both as members of `acme`. Each call is refused with `TokenRejected` before any handler runs: `missing` for D, `invalid` for E.
 */
const missingToken = (directory: string, clock: MutableClock) =>
  world(
    directory,
    clock,
    'token',
    [
      { name: 'd', deviceId: 'p11-d', orgs: [ACME], session: sessionWith(Effect.succeed('')) },
      {
        name: 'e',
        deviceId: 'p11-e',
        orgs: [ACME],
        session: sessionWith(Effect.succeed('not-a-token')),
      },
    ],
    (w) =>
      Effect.gen(function* () {
        const reason = (device: Device) =>
          Effect.match(device.client.pull(ACME), {
            onSuccess: () => 'ok',
            onFailure: (error) =>
              error._tag === 'TokenRejected' ? `TokenRejected ${error.reason}` : error._tag,
          })
        const none = yield* reason(w.device('d'))
        const garbage = yield* reason(w.device('e'))
        yield* require(
          none === 'TokenRejected missing' && garbage === 'TokenRejected invalid',
          JSON.stringify({ none, garbage }),
        )
        return { none, garbage }
      }),
  )

/**
 * p11-check signInNeeded
 * F's session can no longer refresh. A local change still goes into the outbox. `push` fails with `SignInNeeded` and the row stays `pending`, so nothing is lost until F signs in again.
 */
const signInNeeded = (directory: string, clock: MutableClock) =>
  world(
    directory,
    clock,
    'sign-in',
    [
      {
        name: 'f',
        deviceId: 'p11-f',
        orgs: [ACME],
        session: sessionWith(
          Effect.fail(new SignInNeeded({ reason: 'invalid_grant' })),
        ),
      },
    ],
    (w) =>
      Effect.gen(function* () {
        const f = w.device('f')
        yield* f.client.submit(yield* titled(f, ACME, 'one', 'offline'))
        const pushed = yield* outcome(f.client.push(ACME))
        const rows = yield* outboxStates(f)
        yield* require(pushed === 'SignInNeeded', pushed)
        yield* require(
          rows.length === 1 && rows[0]?.state === 'pending',
          JSON.stringify(rows),
        )
        return { push: pushed, state: rows[0]?.state }
      }),
  )

/**
 * p11-check callerStatement
 * `Caller` is the server's statement a device labels its writes with (Q22). For A it names A's person and `acme`. After a grant in `other` it names both; after `acme` is revoked, only `other`. C, never granted, gets no person and no organizations.
 */
const callerStatement = (directory: string, clock: MutableClock) =>
  world(
    directory,
    clock,
    'caller',
    [...members, { name: 'c', deviceId: 'p11-c', orgs: [] }],
    (w) =>
      Effect.gen(function* () {
        const a = w.device('a')
        const account = w.issuer.account('p11-a')
        const first = yield* a.rpc.caller
        yield* require(
          first.person === personOf(a) &&
            JSON.stringify(first.organizations) === JSON.stringify([ACME]) &&
            first.account.subject === 'p11-a',
          JSON.stringify(first),
        )
        yield* w.memberships.grant(OTHER, account)
        const both = (yield* a.rpc.caller).organizations
        yield* w.memberships.revoke(ACME, account)
        const after = (yield* a.rpc.caller).organizations
        const none = yield* w.device('c').rpc.caller
        yield* require(
          JSON.stringify(both) === JSON.stringify([ACME, OTHER]) &&
            JSON.stringify(after) === JSON.stringify([OTHER]) &&
            none.person === null &&
            none.organizations.length === 0,
          JSON.stringify({ both, after, none }),
        )
        return { first: first.organizations, both, after, none: none.person }
      }),
  )

export const runP11NodeChecks = (
  directory: string,
  clock: MutableClock,
): Effect.Effect<CheckResult[], never, Scope.Scope> =>
  Effect.all(
    [
      runCheck('P11', 'cross-organization denied', 'crossOrganization', crossOrganization(directory, clock)),
      runCheck('P11', 'never granted', 'neverGranted', neverGranted(directory, clock)),
      runCheck('P11', 'lease', 'lease', lease(directory, clock)),
      runCheck('P11', 'actor', 'actor', actor(directory, clock)),
      runCheck('P11', 'server-only attributes', 'serverOnlyAttributes', serverOnlyAttributes(directory, clock)),
      runCheck('P11', 'server-only root', 'serverOnlyRoot', serverOnlyRoot(directory, clock)),
      runCheck('P11', 'revocation', 'revocation', revocation(directory, clock)),
      runCheck('P11', 'acceptance time', 'acceptanceTime', acceptanceTime(directory, clock)),
      runCheck('P11', 'blobs per organization', 'blobsPerOrganization', blobsPerOrganization(directory, clock)),
      runCheck('P11', 'missing token', 'missingToken', missingToken(directory, clock)),
      runCheck('P11', 'sign-in needed keeps outbox', 'signInNeeded', signInNeeded(directory, clock)),
      runCheck('P11', 'caller statement', 'callerStatement', callerStatement(directory, clock)),
    ],
    { concurrency: 1 },
  )

export type P11NodeRun = {
  readonly checks: ReadonlyArray<CheckResult>
  readonly spans: ReadonlyArray<Tracer.NativeSpan>
}

export const runP11Node = (): Effect.Effect<P11NodeRun, unknown> => {
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
      const directory = yield* withTempDirectory('viviefs-p11-')
      const clock = makeMutableClock(1_700_000_000_000)
      return yield* runP11NodeChecks(directory, clock)
    }),
  ).pipe(
    Effect.provideService(Tracer.Tracer, tracer),
    Effect.map((checks) => ({ checks, spans })),
  )
}
