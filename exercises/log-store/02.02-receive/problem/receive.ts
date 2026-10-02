import { FUTURE_SKEW_MS } from '@viviefs/datom'

/** A hybrid logical clock value: physical time in ms, and a counter. */
export type Time = { readonly pt: number; readonly c: number }

export type Received =
  | { readonly _tag: 'ok'; readonly last: Time }
  | { readonly _tag: 'future_skew'; readonly boundMs: number }

const later = (left: Time, right: Time): Time =>
  left.pt !== right.pt ? (left.pt > right.pt ? left : right) : left.c >= right.c ? left : right

/**
 * What this replica's clock becomes when a `tx` minted elsewhere arrives:
 * never below anything it has seen.
 */
export const receive = (now: number, last: Time | null, remote: Time): Received => {
  // TODO: a remote clock can be wrong too. How far ahead of `now` may it be?
  void FUTURE_SKEW_MS
  return { _tag: 'ok', last: last === null ? remote : later(last, remote) }
}
