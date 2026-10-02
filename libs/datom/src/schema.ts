import * as Schema from 'effect/Schema'
import { isTx, type Tx as TxBrand } from './hlc.ts'

export const Op = Schema.Literals(['assert', 'retract'])
export type Op = typeof Op.Type

export const asTx = (value: string): TxBrand | null =>
  isTx(value) ? value : null

// #region datom
export const Datom = Schema.Struct({
  e: Schema.String,
  a: Schema.String,
  v: Schema.String,
  tx: Schema.String,
  op: Op,
  cs: Schema.String,
})
export type Datom = typeof Datom.Type
// #endregion datom

export const StoredDatom = Schema.Struct({
  seq: Schema.Number,
  e: Schema.String,
  a: Schema.String,
  v: Schema.String,
  tx: Schema.String,
  op: Op,
  cs: Schema.String,
})
export type StoredDatom = typeof StoredDatom.Type

// #region envelope
export const Envelope = Schema.Struct({
  cs: Schema.String,
  actor: Schema.String,
  device: Schema.String,
  leaseEpoch: Schema.NullOr(Schema.Number),
  traceId: Schema.String,
  spanId: Schema.String,
  sampled: Schema.Boolean,
  command: Schema.String,
  /**
   * Server wall-clock milliseconds when the server accepted the changeset.
   * Null until then. Set once: a later value never replaces it.
   */
  acceptedAt: Schema.NullOr(Schema.Int),
})
export type Envelope = typeof Envelope.Type
// #endregion envelope

export type Cursor = number

export type AppendResult = {
  readonly inserted: number
  readonly duplicates: number
}

export type CompactResult = {
  readonly removed: number
  readonly horizon: Cursor
  /**
   * The consumer whose acknowledged cursor sets the horizon, or null when no
   * consumer is registered. A consumer that stays behind (a device offline,
   * a trace sink down) is named here instead of losing facts it has not seen.
   */
  readonly heldBy: string | null
}

export class FutureSkew extends Schema.TaggedError<FutureSkew>()('FutureSkew', {
  pt: Schema.Number,
  now: Schema.Number,
  boundMs: Schema.Number,
}) {}

export class InvalidTx extends Schema.TaggedError<InvalidTx>()('InvalidTx', {
  tx: Schema.String,
}) {}
