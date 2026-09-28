import * as Schema from 'effect/Schema'
import * as Rpc from 'effect/unstable/rpc/Rpc'
import * as RpcGroup from 'effect/unstable/rpc/RpcGroup'
import * as RpcMiddleware from 'effect/unstable/rpc/RpcMiddleware'
import { Datom, Envelope, StoredDatom } from '@viviefs/datom'
import {
  Caller,
  CallerStatement,
  type IdentityProviderUnreachable,
  type SignInNeeded,
  TokenRejected,
} from '@viviefs/identity'

/**
 * Bearer authentication (P11, ADR-0022). On every RPC in the group the server
 * half requires `authorization: Bearer`, verifies the token and provides the
 * `Caller`; the client half attaches the current access token. Building a
 * client without the client half is a compile error. Authentication only:
 * membership, actor and lease are checked by the handlers.
 */
export class BearerAuthentication extends RpcMiddleware.Service<
  BearerAuthentication,
  {
    provides: Caller
    clientError: SignInNeeded | IdentityProviderUnreachable
  }
>()('viviefs/sync/BearerAuthentication', {
  error: TokenRejected,
  requiredForClient: true,
}) {}

/** The caller is not, or no longer, a member of the requested organization. */
export class MembershipMissing extends Schema.TaggedError<MembershipMissing>()(
  'MembershipMissing',
  { org: Schema.String },
) {}

/** The envelope names an actor other than the caller's person. */
export class ActorMismatch extends Schema.TaggedError<ActorMismatch>()(
  'ActorMismatch',
  { actor: Schema.String, caller: Schema.NullOr(Schema.String) },
) {}

/** A client changeset writes an attribute only the server may write. */
export class ServerOnlyAttribute extends Schema.TaggedError<ServerOnlyAttribute>()(
  'ServerOnlyAttribute',
  { attribute: Schema.String },
) {}

export class UnknownAttribute extends Schema.TaggedError<UnknownAttribute>()(
  'UnknownAttribute',
  { attribute: Schema.String },
) {}

export class StaleLease extends Schema.TaggedError<StaleLease>()('StaleLease', {
  execution: Schema.String,
  epoch: Schema.Number,
  holderEpoch: Schema.Number,
}) {}

export class BasisRejected extends Schema.TaggedError<BasisRejected>()(
  'BasisRejected',
  {
    entity: Schema.String,
    attribute: Schema.String,
    basis: Schema.Number,
  },
) {}

export class OrgMismatch extends Schema.TaggedError<OrgMismatch>()(
  'OrgMismatch',
  {
    org: Schema.String,
    entity: Schema.String,
  },
) {}

export class FileMissing extends Schema.TaggedError<FileMissing>()(
  'FileMissing',
  { hash: Schema.String },
) {}

export class ManifestRejected extends Schema.TaggedError<ManifestRejected>()(
  'ManifestRejected',
  {
    cs: Schema.String,
    reason: Schema.String,
  },
) {}

export class BlobHashMismatch extends Schema.TaggedError<BlobHashMismatch>()(
  'BlobHashMismatch',
  { hash: Schema.String },
) {}

export const Rejection = Schema.Union([
  UnknownAttribute,
  StaleLease,
  BasisRejected,
  OrgMismatch,
  FileMissing,
  ManifestRejected,
  MembershipMissing,
  ActorMismatch,
  ServerOnlyAttribute,
])
export type Rejection = typeof Rejection.Type

export const AppendAck = Schema.Struct({
  cursor: Schema.Number,
})
export type AppendAck = typeof AppendAck.Type

export const PullPage = Schema.Struct({
  cursor: Schema.Number,
  datoms: Schema.Array(StoredDatom),
  envelopes: Schema.Array(Envelope),
})
export type PullPage = typeof PullPage.Type

export const PutBlobAck = Schema.Struct({
  hash: Schema.String,
})
export type PutBlobAck = typeof PutBlobAck.Type

export const Append = Rpc.make('Append', {
  payload: {
    org: Schema.String,
    basis: Schema.Number,
    envelope: Envelope,
    datoms: Schema.Array(Datom),
  },
  success: AppendAck,
  error: Rejection,
})

export const Pull = Rpc.make('Pull', {
  payload: {
    org: Schema.String,
    cursor: Schema.Number,
  },
  success: PullPage,
  error: MembershipMissing,
  stream: true,
})

export const PutBlob = Rpc.make('PutBlob', {
  payload: {
    org: Schema.String,
    hash: Schema.String,
    text: Schema.String,
  },
  success: PutBlobAck,
  error: Schema.Union([BlobHashMismatch, MembershipMissing]),
})

/** A member completes a deferred in their organization (D40, P11 Q7). */
export const CompleteDeferred = Rpc.make('CompleteDeferred', {
  payload: {
    org: Schema.String,
    executionId: Schema.String,
    deferredName: Schema.String,
    exit: Schema.String,
  },
  error: MembershipMissing,
})

/** The server's statement about the signed-in provider account (Q22). */
export const CallerRpc = Rpc.make('Caller', { success: CallerStatement })

/** Every RPC in the group is authenticated; a new one is by default. */
export const SyncRpcs = RpcGroup.make(
  Append,
  Pull,
  PutBlob,
  CompleteDeferred,
  CallerRpc,
).middleware(BearerAuthentication)

export type AppendRequest = {
  readonly org: string
  readonly basis: number
  readonly envelope: typeof Envelope.Type
  readonly datoms: ReadonlyArray<typeof Datom.Type>
}
