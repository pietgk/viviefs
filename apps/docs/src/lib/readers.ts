/**
 * The model behind lesson 3's widget (D216, D223): a device's log and two
 * readers that each read it from their own place. The read models keep their
 * place in `projection_cursor` and move it when the projector has applied what
 * it read (`libs/datom/src/projector.ts`). Trace export keeps its place in the
 * log store as the consumer `trace/motel` and moves it with `acknowledge` once
 * motel has the facts (`TraceProjector.exportOnce` in
 * `libs/telemetry/src/trace-projector.ts`). What motel has received is the
 * sink's business, so the model keeps it beside the store's state, to show
 * what a crash does in each order. The log never loses a fact.
 * `readers.integration.test.ts` plays every action on a real log store and
 * the real projector, and compares.
 */

export const TITLES = ['Visit', 'Roof', 'Attic', 'Garden', 'Cellar', 'Porch'] as const

export type Fact = { readonly seq: number; readonly kind: 'list' | 'title' | 'commit'; readonly v: string }

/** One fact as the sink received it; `again` when it already had it. */
export type Delivery = { readonly seq: number; readonly again: boolean }

export type Action = 'write' | 'project' | 'export' | 'crashAfterSend' | 'ackThenCrash' | 'reset'
export const ACTIONS: ReadonlyArray<Action> = ['write', 'project', 'export', 'crashAfterSend', 'ackThenCrash', 'reset']

export type State = {
  readonly log: ReadonlyArray<Fact>
  /** Commands written so far: the first creates the list, the rest rename it. */
  readonly commands: number
  /** The read models: their place (`projection_cursor`) and the title they show. */
  readonly models: { readonly place: number; readonly title: string | null }
  /** Trace export: its place (the store's acknowledged cursor for `trace/motel`) and what motel received. */
  readonly exporter: { readonly place: number; readonly received: ReadonlyArray<Delivery> }
  /** Facts motel will never get: its place moved past them before they were sent. */
  readonly lost: ReadonlyArray<number>
  readonly last: { readonly action: Exclude<Action, 'reset'>; readonly read: ReadonlyArray<number> } | null
}

export const initial: State = { log: [], commands: 0, models: { place: 0, title: null }, exporter: { place: 0, received: [] }, lost: [], last: null }

/** Facts the room holds: the list, then one rename per remaining title. */
export const ROOM = 3 + (TITLES.length - 1) * 2

const end = (state: State) => state.log.at(-1)?.seq ?? 0

/** `streamFrom(place)`: the facts after a place, in log order. */
export const after = (log: ReadonlyArray<Fact>, place: number): ReadonlyArray<Fact> => log.filter(({ seq }) => seq > place)

/** The facts a command writes: `createList` asserts the list and its title, `renameList` only the title; each ends with its commit. */
export const commandFacts = (commands: number): ReadonlyArray<Omit<Fact, 'seq'>> => {
  const title = TITLES[commands] ?? TITLES[0]
  return commands === 0
    ? [{ kind: 'list', v: 'O1/L1' }, { kind: 'title', v: title }, { kind: 'commit', v: '{"n":2,…}' }]
    : [{ kind: 'title', v: title }, { kind: 'commit', v: '{"n":1,…}' }]
}

export const can = (state: State, action: Action): boolean => {
  switch (action) {
    case 'write':
      return state.commands < TITLES.length
    case 'project':
      return state.models.place < end(state)
    case 'export':
    case 'crashAfterSend':
    case 'ackThenCrash':
      return state.exporter.place < end(state)
    case 'reset':
      return true
  }
}

const send = (received: ReadonlyArray<Delivery>, facts: ReadonlyArray<Fact>): ReadonlyArray<Delivery> => [
  ...received,
  ...facts.map(({ seq }) => ({ seq, again: received.some((delivery) => delivery.seq === seq) })),
]

export const step = (state: State, action: Action): State => {
  if (action === 'reset') return initial
  if (!can(state, action)) return state
  const unread = action === 'project' ? after(state.log, state.models.place) : after(state.log, state.exporter.place)
  const read = unread.map(({ seq }) => seq)
  const last = { action, read }
  switch (action) {
    case 'write': {
      const facts = commandFacts(state.commands).map((fact, i) => ({ ...fact, seq: end(state) + i + 1 }))
      return { ...state, log: [...state.log, ...facts], commands: state.commands + 1, last: { action, read: facts.map(({ seq }) => seq) } }
    }
    case 'project': {
      // The projector applies what it read, then saves its place.
      const title = [...state.log].reverse().find(({ kind }) => kind === 'title')?.v ?? null
      return { ...state, models: { place: end(state), title }, last }
    }
    case 'export':
      // Deliver, then acknowledge.
      return { ...state, exporter: { place: end(state), received: send(state.exporter.received, unread) }, last }
    case 'crashAfterSend':
      // Delivered, then the device stops before it acknowledges: the place stays, so the next export sends them again.
      return { ...state, exporter: { ...state.exporter, received: send(state.exporter.received, unread) }, last }
    case 'ackThenCrash':
      // The mistake: acknowledged, then the device stops before it sends. The place is past facts motel never got.
      return { ...state, exporter: { ...state.exporter, place: end(state) }, lost: [...state.lost, ...read.filter((seq) => !state.exporter.received.some((delivery) => delivery.seq === seq))], last }
  }
}
