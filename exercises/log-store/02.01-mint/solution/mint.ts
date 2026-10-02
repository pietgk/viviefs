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
  // Time did not move forward: keep the last pt and count, never go below it.
  if (last.c < COUNTER_MAX) return { pt: last.pt, c: last.c + 1 }
  return { pt: last.pt + 1, c: 0 }
}
