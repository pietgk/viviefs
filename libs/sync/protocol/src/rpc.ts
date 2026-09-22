import * as Schema from 'effect/Schema'
import * as Rpc from 'effect/unstable/rpc/Rpc'
import * as RpcGroup from 'effect/unstable/rpc/RpcGroup'
import { Datom, Envelope, StoredDatom } from '@viviefs/datom'

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
  stream: true,
})

export const PutBlob = Rpc.make('PutBlob', {
  payload: {
    org: Schema.String,
    hash: Schema.String,
    text: Schema.String,
  },
  success: PutBlobAck,
  error: Schema.Union([BlobHashMismatch, OrgMismatch]),
})

export const SyncRpcs = RpcGroup.make(Append, Pull, PutBlob)

export type AppendRequest = {
  readonly org: string
  readonly basis: number
  readonly envelope: typeof Envelope.Type
  readonly datoms: ReadonlyArray<typeof Datom.Type>
}
