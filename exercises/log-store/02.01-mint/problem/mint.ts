/** A hybrid logical clock value: physical time in ms, and a counter. */
export type Time = { readonly pt: number; readonly c: number }

/** The largest counter a `tx` can encode (16 bits). */
export const COUNTER_MAX = 0xffff

/**
 * The next clock value, given the corrected physical time `now` and the last
 * value this replica minted or received.
 */
export const mint = (now: number, last: Time | null): Time => {
  if (last === null || now > last.pt) return { pt: now, c: 0 }
  // TODO: the clock did not move forward: the same millisecond, or a jump back.
  return { pt: now, c: 0 }
}
