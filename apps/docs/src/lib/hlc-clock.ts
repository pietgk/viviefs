/**
 * The model behind lesson 2's widget (D216): two devices minting tags with
 * a hybrid logical clock. It follows `libs/datom/src/hlc.ts` and the log
 * store's clock: the first mint after a boot takes the wall clock (never
 * below the last `pt` it saved), after that time comes from the monotonic
 * clock, so a wall clock set back changes nothing until the next boot; a tag
 * from another device moves the clock up, unless it is more than 5000 ms
 * ahead. Pure. `hlc-clock.integration.test.ts` plays the same actions on two
 * real log stores on sqlite-node, with clocks it controls, and compares.
 */

/** Where both wall clocks start, in ms; the widget shows times from here. */
export const T0 = 1_700_000_000_000
export const FUTURE_SKEW_MS = 5_000
export const JUMP_BACK_MS = 120_000
export const AHEAD_STEP_MS = 3_000

export type Hlc = { readonly pt: number; readonly c: number }
type Boot = { readonly monoOrigin: number; readonly correctedOrigin: number }

export type ClockDevice = 'A' | 'B'

/** A tag a device minted or took in, in the order it did. */
export type Entry = { readonly kind: 'minted' | 'received' | 'refused'; readonly label: string; readonly hlc: Hlc }

export type Device = {
  readonly wall: number
  readonly mono: number
  /** The last value, saved with every mint: what survives a reboot. */
  readonly last: Hlc | null
  /** In memory only: lost on a reboot. */
  readonly boot: Boot | null
  readonly mints: number
  readonly entries: ReadonlyArray<Entry>
}

export type Action = `mint ${ClockDevice}` | 'wait' | 'jumpBack' | 'reboot' | 'ahead' | 'receive' | 'reset'
export const ACTIONS: ReadonlyArray<Action> = ['mint A', 'wait', 'jumpBack', 'reboot', 'receive', 'mint B', 'ahead', 'reset']

export type State = {
  readonly A: Device
  readonly B: Device
  readonly last: { readonly action: Exclude<Action, 'reset'>; readonly entry: Entry | null } | null
}

const device = (wall: number): Device => ({ wall, mono: 0, last: null, boot: null, mints: 0, entries: [] })

export const initial: State = { A: device(T0), B: device(T0), last: null }

/** At most this many entries per device, so the widget stays small. */
export const ROOM = 12

export const compare = (left: Hlc, right: Hlc): number => (left.pt !== right.pt ? Math.sign(left.pt - right.pt) : Math.sign(left.c - right.c))

/** `correctedNow`: the time a mint or a receive uses, and the boot session it starts. */
const now = (d: Device): { readonly now: number; readonly boot: Boot } => {
  if (d.boot) return { now: Math.floor(d.boot.correctedOrigin + (d.mono - d.boot.monoOrigin)), boot: d.boot }
  const lastPt = d.last?.pt ?? 0
  const wall = Math.floor(d.wall)
  const value = wall > lastPt ? wall : lastPt
  return { now: value, boot: { monoOrigin: d.mono, correctedOrigin: value } }
}

// #region mint
/** `mintHlc`: time moved past the last `pt`, so (now, 0); otherwise the last `pt` and one more on the counter. */
export const mint = (time: number, last: Hlc | null): Hlc => (last === null || time > last.pt ? { pt: time, c: 0 } : { pt: last.pt, c: last.c + 1 })
// #endregion mint

// #region receive
/** `receiveHlc`: a tag from elsewhere moves the clock up to it, unless it is too far ahead. */
export const receive = (time: number, last: Hlc | null, remote: Hlc): { readonly ok: true; readonly last: Hlc } | { readonly ok: false } =>
  remote.pt > time + FUTURE_SKEW_MS ? { ok: false } : { ok: true, last: last === null || compare(remote, last) > 0 ? remote : last }
// #endregion receive

/** B's last minted tag: what "receive" brings to A. */
export const lastOfB = (state: State): Entry | undefined => [...state.B.entries].reverse().find(({ kind }) => kind === 'minted')

/** How far B's wall clock runs ahead of the time that has passed (B never reboots). */
export const aheadOfB = (state: State): number => state.B.wall - T0 - state.B.mono

export const can = (state: State, action: Action): boolean => {
  switch (action) {
    case 'mint A':
    case 'receive':
      return state.A.entries.length < ROOM && (action === 'mint A' || lastOfB(state) !== undefined)
    case 'mint B':
      return state.B.entries.length < ROOM
    case 'ahead':
      // B's wall clock counts only before its first mint; after that its clock runs on monotonic time.
      return state.B.boot === null && aheadOfB(state) < 2 * AHEAD_STEP_MS
    case 'reboot':
      return state.A.boot !== null
    default:
      return true
  }
}

export const step = (state: State, action: Action): State => {
  if (!can(state, action)) return state
  switch (action) {
    case 'reset':
      return initial
    case 'wait': {
      const tick = (d: Device): Device => ({ ...d, wall: d.wall + 1, mono: d.mono + 1 })
      return { A: tick(state.A), B: tick(state.B), last: { action, entry: null } }
    }
    case 'jumpBack':
      return { ...state, A: { ...state.A, wall: state.A.wall - JUMP_BACK_MS }, last: { action, entry: null } }
    case 'reboot':
      // The monotonic clock starts over and the boot session is gone; the saved last value stays.
      return { ...state, A: { ...state.A, mono: 0, boot: null }, last: { action, entry: null } }
    case 'ahead':
      return { ...state, B: { ...state.B, wall: state.B.wall + AHEAD_STEP_MS }, last: { action, entry: null } }
    case 'receive': {
      const remote = lastOfB(state)
      if (remote === undefined) return state
      const { now: time, boot } = now(state.A)
      const result = receive(time, state.A.last, remote.hlc)
      const entry: Entry = { kind: result.ok ? 'received' : 'refused', label: remote.label, hlc: remote.hlc }
      const A: Device = { ...state.A, boot, last: result.ok ? result.last : state.A.last, entries: [...state.A.entries, entry] }
      return { ...state, A, last: { action, entry } }
    }
    default: {
      const who: ClockDevice = action === 'mint A' ? 'A' : 'B'
      const d = state[who]
      const { now: time, boot } = now(d)
      const hlc = mint(time, d.last)
      const entry: Entry = { kind: 'minted', label: `${who}${d.mints + 1}`, hlc }
      const next: Device = { ...d, boot, last: hlc, mints: d.mints + 1, entries: [...d.entries, entry] }
      return { ...state, [who]: next, last: { action, entry } }
    }
  }
}

/** Every tag either device minted, in the order the tags sort: the order the log keeps. */
export const tagOrder = (state: State): ReadonlyArray<Entry> =>
  [...state.A.entries, ...state.B.entries].filter(({ kind }) => kind === 'minted').sort((left, right) => compare(left.hlc, right.hlc) || left.label.localeCompare(right.label))

/** A time as the widget shows it: ms from where the clocks started. */
export const fromStart = (ms: number): string => `${ms - T0 >= 0 ? '+' : ''}${ms - T0}`
