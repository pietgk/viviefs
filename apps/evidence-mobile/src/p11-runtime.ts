/**
 * P11 on a device (ADR-0022): sign in at the identity provider with PKCE,
 * keep the server's statement inside the sign-in session (Q22), open one
 * local replica per provider account (Q11), and sync through the evidence
 * server with the session's access token.
 *
 * The screen drives it; the probe reads `globalThis.__viviefsP11` after
 * every action. Each action is serialized and counted, so a reader can wait
 * for `extra.actions` to move and then read `extra.last`.
 */
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Scope from 'effect/Scope'
import * as Semaphore from 'effect/Semaphore'
import * as Stream from 'effect/Stream'
import * as FetchHttpClient from 'effect/unstable/http/FetchHttpClient'
import * as RpcClient from 'effect/unstable/rpc/RpcClient'
import * as RpcSerialization from 'effect/unstable/rpc/RpcSerialization'
import * as SqlClient from 'effect/unstable/sql/SqlClient'
import {
  deviceLayer,
  evidenceCatalog,
  liveClock,
  LogStore,
  orgId,
  rowsOf,
  SqlNumber,
} from '@viviefs/datom'
import { renameList } from '@viviefs/evidence-model'
import {
  oidcSignInSession,
  SignInSession,
  type SignInState,
} from '@viviefs/identity'
import {
  callerStatementsLayer,
  replicaName,
  SyncClient,
  syncClientLayer,
  syncRpcClientLayer,
} from '@viviefs/sync-client'
// Without extension, so Metro picks `p11-platform.web.ts` on web.
import {
  deleteP11Replica,
  p11AuthorizationPrompt,
  p11ReplicaStore,
  p11SignInVault,
  P11_SCOPES,
} from './p11-platform'
import { localStorageVault, P11_CONTROL, refusalsIgnored } from './p11-control.ts'
import { currentPlatform } from './probe-report.ts'

const OutboxCountRow = Schema.Struct({
  org: Schema.String,
  state: Schema.String,
  n: SqlNumber,
})

export const P11_SLOT = '__viviefsP11'
export const P11_ORGS = ['acme', 'other'] as const
export type P11Org = (typeof P11_ORGS)[number]

// Expo inlines `process.env.EXPO_PUBLIC_*` only when read by its full name.
const ISSUER =
  process.env.EXPO_PUBLIC_P11_ISSUER ?? 'http://localhost:28080/realms/viviefs'
const CLIENT_ID = process.env.EXPO_PUBLIC_P11_CLIENT ?? 'viviefs-mobile'
const SERVER = process.env.EXPO_PUBLIC_P11_SERVER ?? 'http://localhost:8787/rpc'
const RUN = (process.env.EXPO_PUBLIC_P11_RUN ?? 'dev').replace(/[^A-Za-z0-9_-]/g, '')
const VARIANT = process.env.EXPO_PUBLIC_P11_VARIANT ?? 'sign-in'

export type OutboxCounts = {
  readonly pending: number
  readonly acked: number
  readonly rejected: number
  readonly waiting: number
}

export type P11Extra = {
  readonly run: string
  /** The positive control this build carries, if any (`p11-control.ts`). */
  readonly control: string | null
  readonly state: 'starting' | SignInState['_tag']
  readonly subject: string | null
  readonly person: string | null
  readonly organizations: ReadonlyArray<string>
  readonly reason: string | null
  readonly replica: string | null
  readonly outbox: Record<P11Org, OutboxCounts>
  readonly rows: Record<P11Org, number>
  readonly busy: string | null
  readonly actions: number
  readonly last: { readonly action: string; readonly outcome: string } | null
}

export type P11Report = {
  readonly gate: 'P11'
  readonly platform: 'ios' | 'android' | 'web'
  readonly variant: string
  readonly host: 'dev-client'
  readonly ready: boolean
  readonly error: string | null
  readonly report: string
  readonly checks: ReadonlyArray<never>
  readonly extra: P11Extra
}

export type P11Action =
  | { readonly _tag: 'signIn' }
  | { readonly _tag: 'signOut' }
  | { readonly _tag: 'removeAccount' }
  | { readonly _tag: 'write'; readonly org: P11Org }
  | { readonly _tag: 'sync'; readonly org: P11Org }

export const actionName = (action: P11Action): string =>
  'org' in action ? `${action._tag} ${action.org}` : action._tag

const noOutbox: OutboxCounts = { pending: 0, acked: 0, rejected: 0, waiting: 0 }

const report = (extra: P11Extra, error: string | null = null): P11Report => ({
  gate: 'P11',
  platform: currentPlatform(),
  variant: VARIANT,
  host: 'dev-client',
  ready: extra.state !== 'starting',
  error,
  report: extra.last ? `${extra.last.action}: ${extra.last.outcome}` : extra.state,
  checks: [],
  extra,
})

export const startingP11 = (): P11Report =>
  report({
    run: RUN,
    control: P11_CONTROL,
    state: 'starting',
    subject: null,
    person: null,
    organizations: [],
    reason: null,
    replica: null,
    outbox: { acme: noOutbox, other: noOutbox },
    rows: { acme: 0, other: 0 },
    busy: null,
    actions: 0,
    last: null,
  })

const deviceId = `p11-${currentPlatform()}-${RUN}`

const protocol = RpcClient.layerProtocolHttp({ url: SERVER }).pipe(
  Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]),
)

// The positive controls (`p11-control.ts`) replace one port each.
const providerHttp =
  P11_CONTROL === 'ignore-invalid-grant'
    ? refusalsIgnored.pipe(Layer.provide(FetchHttpClient.layer))
    : FetchHttpClient.layer

const vault =
  P11_CONTROL === 'persistent-web-vault'
    ? localStorageVault(`viviefs.sign-in.${RUN}`)
    : p11SignInVault(RUN)

const session = oidcSignInSession({
  issuer: ISSUER,
  clientId: CLIENT_ID,
  scopes: P11_SCOPES,
}).pipe(
  Layer.provide([
    providerHttp,
    p11AuthorizationPrompt,
    vault,
    callerStatementsLayer.pipe(Layer.provide(protocol)),
  ]),
)

const deviceBase = syncRpcClientLayer.pipe(
  Layer.provide(protocol),
  Layer.provideMerge(session),
)

const replicaLayer = (name: string) =>
  syncClientLayer(evidenceCatalog).pipe(
    Layer.provideMerge(p11ReplicaStore(name, deviceId)),
    Layer.provide(deviceLayer(deviceId)),
    Layer.provide(liveClock),
  )

type Replica = {
  readonly key: string
  readonly name: string
  readonly scope: Scope.Closeable
  readonly context: Context.Context<SyncClient | LogStore | SqlClient.SqlClient>
}

const describe = (error: unknown): string => {
  if (typeof error !== 'object' || error === null) return String(error)
  const tagged = error as { _tag?: string; reason?: unknown; message?: string }
  const tag = tagged._tag ?? 'Error'
  if (typeof tagged.reason === 'string') return `${tag} ${tagged.reason}`
  return tag
}

export type P11Device = {
  readonly run: (action: P11Action) => Promise<void>
  readonly dispose: () => Promise<void>
}

/**
 * Starts the device: restores the sign-in session (secure storage on iOS
 * and Android, nothing on web), opens its account's replica, and publishes
 * a report after every change.
 */
export const startP11Device = (publish: (report: P11Report) => void): P11Device => {
  const runtime = ManagedRuntime.make(deviceBase)
  let replica: Replica | null = null
  let actions = 0
  let busy: string | null = null
  let last: P11Extra['last'] = null
  let written = 0
  const lock = Semaphore.makeUnsafe(1)

  const closeReplica = Effect.gen(function* () {
    if (replica === null) return
    const open = replica
    replica = null
    yield* Scope.close(open.scope, Exit.void)
  })

  // The replica follows the session's account: signing out closes it,
  // another account opens its own.
  const followAccount = Effect.gen(function* () {
    const signIn = yield* SignInSession
    const state = yield* signIn.state
    const account = state._tag === 'SignedOut' ? null : state.account
    const key = account === null ? null : `${account.issuer} ${account.subject}`
    if (replica !== null && replica.key === key) return replica
    yield* closeReplica
    if (account === null || key === null) return null
    const name =
      P11_CONTROL === 'shared-replica' ? `${RUN}-shared` : `${RUN}-${yield* replicaName(account)}`
    const scope = yield* Scope.make()
    const context = yield* Layer.buildWithScope(replicaLayer(name), scope)
    replica = { key, name, scope, context }
    return replica
  })

  const outboxCounts = (open: Replica) =>
    Effect.gen(function* () {
      const sql = Context.get(open.context, SqlClient.SqlClient)
      const rows = yield* sql`
        SELECT org, state, COUNT(*) AS n FROM outbox GROUP BY org, state
      `.pipe(rowsOf(OutboxCountRow))
      const counts = (org: P11Org): OutboxCounts => {
        const of = (state: string) =>
          Number(rows.find((row) => row.org === org && row.state === state)?.n ?? 0)
        return {
          pending: of('pending'),
          acked: of('acked'),
          rejected: of('rejected'),
          waiting: of('waiting-file'),
        }
      }
      return { acme: counts('acme'), other: counts('other') }
    })

  const localRows = (open: Replica) =>
    Effect.gen(function* () {
      const store = Context.get(open.context, LogStore)
      const count = (org: P11Org) =>
        Effect.map(store.scanPrefix(`${orgId(org)}/`), (rows) => rows.length)
      return { acme: yield* count('acme'), other: yield* count('other') }
    })

  const snapshot = Effect.gen(function* () {
    const signIn = yield* SignInSession
    const state = yield* signIn.state
    const open = replica
    const extra: P11Extra = {
      run: RUN,
      control: P11_CONTROL,
      state: state._tag,
      subject: state._tag === 'SignedOut' ? null : state.account.subject,
      person: state._tag === 'SignedOut' ? null : state.statement.person,
      organizations: state._tag === 'SignedOut' ? [] : state.statement.organizations,
      reason: state._tag === 'SignInNeeded' ? state.reason : null,
      replica: open?.name ?? null,
      outbox: open ? yield* outboxCounts(open) : { acme: noOutbox, other: noOutbox },
      rows: open ? yield* localRows(open) : { acme: 0, other: 0 },
      busy,
      actions,
      last,
    }
    publish(report(extra))
  })

  const publishNow = snapshot.pipe(
    Effect.catchCause((cause) =>
      Effect.sync(() =>
        publish(report(startingP11().extra, String(cause).split('\n')[0] ?? 'failed')),
      ),
    ),
  )

  const clientOf = (open: Replica | null) => {
    if (open === null) return Effect.fail({ _tag: 'SignedOut' as const })
    return Effect.succeed(Context.get(open.context, SyncClient))
  }

  const perform = (action: P11Action) =>
    Effect.gen(function* () {
      const signIn = yield* SignInSession
      switch (action._tag) {
        case 'signIn': {
          const state = yield* signIn.signIn
          yield* followAccount
          return state._tag
        }
        case 'signOut': {
          yield* signIn.signOut
          yield* followAccount
          return 'SignedOut'
        }
        case 'removeAccount': {
          const open = yield* followAccount
          if (open === null) return 'SignedOut'
          yield* signIn.signOut
          yield* followAccount
          yield* deleteP11Replica(open.name)
          return 'removed'
        }
        case 'write': {
          const state = yield* signIn.state
          if (state._tag === 'SignedOut') return 'SignedOut'
          // Writes are labelled with the person the server named (Q22).
          const person = state.statement.person
          if (person === null) return 'no person'
          const open = yield* followAccount
          if (open === null) return 'SignedOut'
          const client = Context.get(open.context, SyncClient)
          const store = Context.get(open.context, LogStore)
          written += 1
          const changeset = yield* renameList(
            { title: null },
            {
              org: action.org,
              list: `${RUN}-${deviceId}-${written}`,
              title: `${currentPlatform()} write ${written}`,
            },
            {
              cs: yield* store.mint(),
              memberTx: yield* store.mint(),
              extraTx: yield* store.mint(),
              commitTx: yield* store.mint(),
              actor: person,
              device: deviceId,
              basis: 0,
            },
          )
          yield* client.submit(changeset)
          return 'pending'
        }
        case 'sync': {
          const client = yield* clientOf(yield* followAccount)
          const pushed = yield* client.push(action.org)
          const refused = pushed.rejected.map((rejection) => rejection.tag)
          // The server's statement is stale when it refuses who we are.
          if (refused.some((tag) => tag === 'MembershipMissing' || tag === 'ActorMismatch')) {
            yield* signIn.refreshStatement.pipe(Effect.ignore)
          }
          return refused.length > 0
            ? `acked ${pushed.acked.length} rejected ${refused.join(',')}`
            : `acked ${pushed.acked.length}`
        }
      }
    })

  const run = (action: P11Action) =>
    runtime.runPromise(
      lock.withPermits(1)(
        Effect.gen(function* () {
          busy = actionName(action)
          yield* publishNow
          const outcome = yield* perform(action).pipe(
            Effect.catchCause((cause) => {
              const failure = cause.reasons.find((reason) => reason._tag === 'Fail')
              return Effect.succeed(
                failure?._tag === 'Fail' ? describe(failure.error) : String(cause).split('\n')[0] ?? 'defect',
              )
            }),
          )
          actions += 1
          busy = null
          last = { action: actionName(action), outcome }
          yield* publishNow
        }),
      ),
    )

  // Restore, open the restored account's replica, then follow the session
  // (a refused refresh moves it to sign-in needed in the middle of a sync).
  void runtime.runPromise(
    Effect.gen(function* () {
      yield* followAccount.pipe(Effect.ignore)
      yield* publishNow
      const signIn = yield* SignInSession
      yield* Effect.forkDetach(
        Stream.runForEach(signIn.changes, () => publishNow),
      )
    }),
  )

  return {
    run,
    dispose: () =>
      runtime
        .runPromise(closeReplica)
        .finally(() => runtime.dispose()),
  }
}
