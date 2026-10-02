/**
 * A small authenticated sync world for Node probes (P09, P11): one server on
 * sqlite-node with an in-memory blob store and a fake issuer, and devices that
 * each have their own sign-in session, RPC client and log. Each device is a
 * member of the organizations it lists; granting mints its person.
 */
import { join } from 'node:path'
import * as Cause from 'effect/Cause'
import * as Context from 'effect/Context'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import type * as Scope from 'effect/Scope'
import type * as RpcClient from 'effect/rpc/RpcClient'
import * as RpcTest from 'effect/rpc/RpcTest'
import * as SqlClient from 'effect/sql/SqlClient'
import { layerMemory } from '@viviefs/blobs'
import {
  HlcClock,
  LogStore,
  Projector,
  deviceLayer,
  evidenceCatalog,
  type Catalog,
} from '@viviefs/datom'
import type { SignInSession } from '@viviefs/identity'
import { sqliteNodeLogStore } from '@viviefs/store-sqlite-node'
import {
  SyncClient,
  SyncRpc,
  bearerAuthenticationClient,
  syncClientLayer,
  syncRpcLayer,
  type Outgoing,
} from '@viviefs/sync-client'
import { SyncRpcs } from '@viviefs/sync-protocol'
import {
  Memberships,
  SyncAuthority,
  syncServerLayer,
} from '@viviefs/sync-server'
import type { MutableClock } from '@viviefs/datom/suites'
import { fakeSignInSession, makeFakeIssuer, type FakeIssuer } from '@viviefs/identity/suites'
import type { CheckResult } from '@viviefs/testing'

export const catalog: Catalog = { types: [...evidenceCatalog.types] }

export const TRACE = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
export const SPAN = 'bbbbbbbbbbbbbbbb'

export const require = (ok: boolean, message: string) =>
  ok ? Effect.void : Effect.fail(message)

export const valueOf = (
  facts: ReadonlyArray<{ e: string; a: string; v: string }>,
  entity: string,
  attribute: string,
): string | undefined =>
  facts.find((fact) => fact.e === entity && fact.a === attribute)?.v

/** One check: a `<gate> <name>` span carrying `<gate>.fn`, 30 seconds at most. */
export const runCheck = (
  gate: 'P09' | 'P11',
  name: string,
  fn: string,
  effect: Effect.Effect<unknown, unknown, Scope.Scope>,
): Effect.Effect<CheckResult, never, Scope.Scope> =>
  effect.pipe(
    Effect.withSpan(`${gate} ${name}`, {
      attributes: { [`${gate.toLowerCase()}.fn`]: fn },
    }),
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

export type Device = {
  readonly id: string
  /** The device's signed-in person; null if it was never granted anything. */
  readonly person: string | null
  readonly client: SyncClient['Service']
  readonly store: LogStore['Service']
  readonly projector: Projector['Service']
  /**
   * The device's RPCs, for calls the probe makes itself. Each call is a
   * `SyncRpc.<call>` span carrying `sync.device`, so a span review can draw
   * it on the device's lifeline.
   */
  readonly rpc: SyncRpc['Service']
  /** The device's own database, for reading its outbox. */
  readonly sql: SqlClient.SqlClient
  /** The raw authenticated RPC client, for calls the sync client does not make. */
  readonly raw: RpcClient.FromGroup<typeof SyncRpcs>
  readonly context: Context.Context<
    SyncClient | LogStore | Projector | SyncRpc
  >
}

/** A granted device's person. A device without one is a harness bug here. */
export const personOf = (device: Device): string => {
  if (device.person === null) {
    throw new Error(`device ${device.id} was never granted membership`)
  }
  return device.person
}

export type World = {
  readonly issuer: FakeIssuer
  readonly authority: SyncAuthority['Service']
  readonly memberships: Memberships['Service']
  readonly server: LogStore['Service']
  readonly device: (name: string) => Device
}

export type DeviceSpec = {
  readonly name: string
  readonly deviceId: string
  readonly orgs: ReadonlyArray<string>
  /** Defaults to a signed-in fake session for `deviceId`. */
  readonly session?: (issuer: FakeIssuer) => Layer.Layer<SignInSession>
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

export const envelopeFor = (
  cs: string,
  device: Device,
  command: string,
  leaseEpoch: number | null,
) => ({
  cs,
  actor: device.person ?? '',
  device: device.id,
  leaseEpoch,
  traceId: TRACE,
  spanId: SPAN,
  sampled: false,
  command,
  acceptedAt: null,
})

const tracedRpc = (
  device: string,
  rpc: SyncRpc['Service'],
): SyncRpc['Service'] => {
  const span = (call: string) =>
    Effect.withSpan(`SyncRpc.${call}`, { attributes: { 'sync.device': device } })
  return SyncRpc.of({
    append: (request) => rpc.append(request).pipe(span('append')),
    pull: (request) => rpc.pull(request).pipe(span('pull')),
    putBlob: (request) => rpc.putBlob(request).pipe(span('putBlob')),
    caller: rpc.caller.pipe(span('caller')),
  })
}

export const syncWorld = <A>(
  options: {
    readonly directory: string
    readonly clock: MutableClock
    readonly prefix: string
    readonly devices: ReadonlyArray<DeviceSpec>
  },
  use: (world: World) => Effect.Effect<A, unknown>,
) =>
  Effect.gen(function* () {
    const { directory, clock, prefix } = options
    const issuer = yield* makeFakeIssuer({
      issuer: 'http://probe.test/realms/viviefs',
      audience: 'viviefs-sync',
    })
    const server = yield* Layer.build(
      syncServerLayer(catalog).pipe(
        Layer.provideMerge(
          storeLayer(directory, `${prefix}-server.sqlite`, 'probe-server', clock),
        ),
        Layer.provide(layerMemory),
        Layer.provide(issuer.verifier),
      ),
    )
    const memberships = Context.get(server, Memberships)
    const built = new Map<string, Device>()
    for (const spec of options.devices) {
      let person: string | null = null
      for (const org of spec.orgs) {
        person = yield* memberships.grant(org, issuer.account(spec.deviceId))
      }
      const session =
        spec.session?.(issuer) ?? fakeSignInSession(issuer, spec.deviceId)
      const raw = yield* RpcTest.makeClient(SyncRpcs).pipe(
        Effect.provide(server),
        Effect.provide(
          bearerAuthenticationClient.pipe(Layer.provide(session)),
        ),
      )
      const ctx = yield* Layer.build(
        syncClientLayer(catalog).pipe(
          Layer.provideMerge(
            storeLayer(
              directory,
              `${prefix}-${spec.name}.sqlite`,
              spec.deviceId,
              clock,
            ),
          ),
          Layer.provideMerge(syncRpcLayer(raw)),
          Layer.provide(clockLayer(clock)),
          Layer.provide(deviceLayer(spec.deviceId)),
        ),
      )
      built.set(spec.name, {
        id: spec.deviceId,
        person,
        client: Context.get(ctx, SyncClient),
        store: Context.get(ctx, LogStore),
        projector: Context.get(ctx, Projector),
        rpc: tracedRpc(spec.deviceId, Context.get(ctx, SyncRpc)),
        sql: Context.get(ctx, SqlClient.SqlClient),
        raw,
        context: ctx,
      })
    }
    return yield* use({
      issuer,
      authority: Context.get(server, SyncAuthority),
      memberships,
      server: Context.get(server, LogStore),
      device: (name) => {
        const found = built.get(name)
        if (!found) {
          throw new Error(`missing device ${name}`)
        }
        return found
      },
    })
  })

export const mint = (device: Device, basis: number) =>
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
      actor: device.person ?? '',
      device: device.id,
      basis,
    }
  })

export const selfCommit = (
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
      envelope: envelopeFor(tx, device, options.command, options.epoch),
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

export const committed = (device: Device, prefix: string) =>
  device.projector.facts({ view: 'committed', prefix })
