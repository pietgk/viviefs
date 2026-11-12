/**
 * The model behind lesson 1's widget (I2, D215, D217, D219): two devices and
 * the server, each with its own copy of one organization's log, the facts
 * creating and renaming a list build, and the one step the lesson teaches, append. Pure: no DOM,
 * no clock.
 *
 * It follows what the exemplar does. A device appends a rename's facts to its
 * own log and queues the changeset in its outbox (`SyncClient.submit`); the
 * commit is not in its log until the server accepted it. Sync is
 * `SyncClient.push`: it sends the outbox, where the server, which holds
 * authority, appends each changeset to its log, and a changeset whose every tx
 * it already holds stores nothing (`libs/sync/server`); then it pulls the
 * server's facts after the device's sync cursor and appends them
 * (`SyncClient.pull`). `datom-log.integration.test.ts`
 * plays the same scenarios on the sync server, composed as the evidence
 * server composes it, and two real devices, and compares, so the widget cannot teach what the exemplar does not do.
 */

export type Op = 'assert' | 'retract'

/** A datom, `[e, a, v, tx, op, cs]`, as `libs/datom/src/schema.ts` defines it. */
export type Fact = {
  readonly e: string
  readonly a: string
  readonly v: string
  readonly tx: string
  readonly op: Op
  readonly cs: string
}

/** A fact in one log: its place there, and whether a retry stored it a second time. */
export type Stored = Fact & { readonly seq: number; readonly again: boolean }

export type Outcome = 'inserted' | 'duplicate'

// #region append
/** The step of the lesson: a log keeps each `tx` once. */
export const append = (log: ReadonlyArray<Stored>, fact: Fact & { readonly again?: boolean }): readonly [ReadonlyArray<Stored>, Outcome] =>
  log.some((stored) => stored.tx === fact.tx)
    ? [log, 'duplicate']
    : [[...log, { ...fact, again: fact.again ?? false, seq: log.length + 1 }], 'inserted']
// #endregion append

/** Appends facts in order, as `LogStore.append` does with one call. */
export const appendAll = (
  log: ReadonlyArray<Stored>,
  facts: ReadonlyArray<Fact & { readonly again?: boolean }>,
): readonly [ReadonlyArray<Stored>, ReadonlyArray<Outcome>] =>
  facts.reduce<readonly [ReadonlyArray<Stored>, ReadonlyArray<Outcome>]>(
    ([current, outcomes], fact) => {
      const [next, outcome] = append(current, fact)
      return [next, [...outcomes, outcome]]
    },
    [log, []],
  )

/** The four ids a command may use, minted before it runs (`CommandMint`); a rename leaves `extraTx` unused. */
export type RenameMint = {
  readonly cs: string
  readonly memberTx: string
  readonly extraTx: string
  readonly commitTx: string
}

export const LIST = 'O1/L1'
export const LIST_ATTRIBUTE = 'evidence/list'
export const TITLE_ATTRIBUTE = 'evidence/list/title'
export const COMMIT_ATTRIBUTE = 'viviefs/changeset/commit'
/** The commit's value, cut short: the real one also holds the members' hash. */
export const COMMIT_VALUE = '{"n":2,…}'

/** The commit's value for a changeset of one member, cut short. */
export const COMMIT_VALUE_ONE = '{"n":1,…}'

/**
 * The facts `createList` builds (`features/evidence/model/src/command.ts`):
 * the list exists, its title, and the commit that closes the changeset.
 */
export const createFacts = (title: string, mint: RenameMint): ReadonlyArray<Fact> => [
  { e: LIST, a: LIST_ATTRIBUTE, v: '1', tx: mint.memberTx, op: 'assert', cs: mint.cs },
  { e: LIST, a: TITLE_ATTRIBUTE, v: title, tx: mint.extraTx, op: 'assert', cs: mint.cs },
  { e: mint.cs, a: COMMIT_ATTRIBUTE, v: COMMIT_VALUE, tx: mint.commitTx, op: 'assert', cs: mint.cs },
]

/**
 * The facts `renameList` builds: the new title and the commit. It never
 * asserts the list again, which would restore a list another device deleted (D219).
 */
export const renameFacts = (title: string, mint: RenameMint): ReadonlyArray<Fact> => [
  { e: LIST, a: TITLE_ATTRIBUTE, v: title, tx: mint.memberTx, op: 'assert', cs: mint.cs },
  { e: mint.cs, a: COMMIT_ATTRIBUTE, v: COMMIT_VALUE_ONE, tx: mint.commitTx, op: 'assert', cs: mint.cs },
]

/** What a device appends to its own log when it writes: everything but the commit (`SyncClient.submit`). */
export const ownFacts = (facts: ReadonlyArray<Fact>): ReadonlyArray<Fact> => facts.filter(({ a }) => a !== COMMIT_ATTRIBUTE)

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/**
 * A stand-in for the log store's clock: the `n`th tx, 26 Crockford base32
 * characters that sort in minting order, with a varied tail so the last four
 * characters, which the widget shows, differ.
 */
export const exampleTx = (n: number): string => {
  const tail = (n * 7919 + 104729) % 1024
  const at = (i: number) => CROCKFORD[i & 31] ?? '0'
  return `01KA7Z3M5Q0000000000${at(n >> 5)}${at(n)}00${at(tail >> 5)}${at(tail)}`
}

/** The list's first title, then one per rename, none repeated while the widget has room, so `renameList` never sees an unchanged title. */
export const TITLES = ['Visit', 'Roof', 'Attic', 'Cellar', 'Garden', 'Garage', 'Porch'] as const

export type Device = 'A' | 'B'
export type SyncNode = Device | 'server'
export const DEVICES: ReadonlyArray<Device> = ['A', 'B']
export const SYNC_NODES: ReadonlyArray<SyncNode> = ['A', 'server', 'B']

/** A command's changeset as a device built it: which command, the title, and its facts, commit last. */
export type Changeset = { readonly command: 'create' | 'rename'; readonly title: string; readonly facts: ReadonlyArray<Fact> }

export type Action = `create ${Device}` | `rename ${Device}` | `sync ${Device}` | 'sendAgain' | 'newTags' | 'reset'
export const ACTIONS: ReadonlyArray<Action> = ['create A', 'rename A', 'sync A', 'create B', 'rename B', 'sync B', 'sendAgain', 'newTags', 'reset']

/** One append call on one sync node's log: what it was given, and what it answered per fact. */
export type Call = { readonly at: SyncNode; readonly facts: ReadonlyArray<Fact>; readonly outcomes: ReadonlyArray<Outcome> }

export type Step = {
  readonly action: Exclude<Action, 'reset'>
  readonly by: Device
  /** The append calls, in the order they ran: a rename's on the device, a sync's on the server, then on the device. */
  readonly calls: ReadonlyArray<Call>
}

export type State = {
  /** How many ids the example clock has minted. */
  readonly minted: number
  /** How many commands the devices have written; each takes the next title. */
  readonly commands: number
  readonly logs: Readonly<Record<SyncNode, ReadonlyArray<Stored>>>
  /** Changesets a device wrote and the server has not confirmed (`outbox`). */
  readonly outbox: Readonly<Record<Device, ReadonlyArray<Changeset>>>
  /** How far each device has pulled: the server's last position it received (its sync cursor). */
  readonly cursor: Readonly<Record<Device, number>>
  /** The last changeset a sync sent, and who sent it: what the two retry buttons send again. */
  readonly sent: { readonly by: Device; readonly changeset: Changeset } | null
  readonly last: Step | null
}

export const initial: State = {
  minted: 0,
  commands: 0,
  logs: { A: [], B: [], server: [] },
  outbox: { A: [], B: [] },
  cursor: { A: 0, B: 0 },
  sent: null,
  last: null,
}

/** How many facts the server's log holds before the widget asks for a fresh start. */
export const ROOM = 15

const mintRename = (minted: number): readonly [number, RenameMint] => [
  minted + 4,
  { cs: exampleTx(minted + 1), memberTx: exampleTx(minted + 2), extraTx: exampleTx(minted + 3), commitTx: exampleTx(minted + 4) },
]

/** Facts the server would hold if every outbox were pushed. */
const promised = (state: State) =>
  state.logs.server.length + DEVICES.reduce((sum, device) => sum + state.outbox[device].reduce((n, changeset) => n + changeset.facts.length, 0), 0)

const isDevice = (value: string | undefined): value is Device => value === 'A' || value === 'B'

/** Whether a device's own log says the list exists: what `renameList` reads. */
export const knowsList = (state: State, device: Device): boolean => state.logs[device].some(({ a }) => a === LIST_ATTRIBUTE)

export const can = (state: State, action: Action): boolean => {
  const [verb, who] = action.split(' ')
  if (verb === 'create') return isDevice(who) && state.commands === 0
  if (verb === 'rename') return isDevice(who) && knowsList(state, who) && promised(state) + 2 <= ROOM && state.commands < TITLES.length
  if (verb === 'sync') return isDevice(who) && (state.outbox[who].length > 0 || state.cursor[who] < state.logs.server.length)
  if (action === 'sendAgain') return state.sent !== null
  // The real push sends a device's whole outbox, so the retry with new tags waits until the sender's is empty.
  if (action === 'newTags') return state.sent !== null && state.outbox[state.sent.by].length === 0 && promised(state) + state.sent.changeset.facts.length <= ROOM
  return true
}

/** The server accepts a changeset: it appends all of it, unless it holds every tx already. */
const accept = (log: ReadonlyArray<Stored>, facts: ReadonlyArray<Fact & { readonly again?: boolean }>): readonly [ReadonlyArray<Stored>, ReadonlyArray<Outcome>] =>
  facts.every((fact) => log.some(({ tx }) => tx === fact.tx)) ? [log, facts.map((): Outcome => 'duplicate')] : appendAll(log, facts)

/** A device writes a changeset: its facts but the commit go into its log, the whole changeset into its outbox. */
const write = (state: State, by: Device, changeset: Changeset): readonly [State, Call] => {
  const facts = ownFacts(changeset.facts)
  const [log, outcomes] = appendAll(state.logs[by], facts)
  return [{ ...state, logs: { ...state.logs, [by]: log }, outbox: { ...state.outbox, [by]: [...state.outbox[by], changeset] } }, { at: by, facts, outcomes }]
}

/** The device pulls every server fact after its sync cursor and appends it. */
const pull = (state: State, by: Device): readonly [State, Call] => {
  const facts = state.logs.server.slice(state.cursor[by]).map(({ e, a, v, tx, op, cs, again }) => ({ e, a, v, tx, op, cs, again }))
  const [log, outcomes] = appendAll(state.logs[by], facts)
  return [{ ...state, logs: { ...state.logs, [by]: log }, cursor: { ...state.cursor, [by]: state.logs.server.length } }, { at: by, facts, outcomes }]
}

/** One press of a widget button. An action that `can` refuses leaves the state as it was. */
export const step = (state: State, action: Action): State => {
  if (!can(state, action)) return state
  if (action === 'reset') return initial
  const [verb, who] = action.split(' ')
  if ((verb === 'create' || verb === 'rename') && isDevice(who)) {
    const title = TITLES[state.commands] ?? TITLES[0]
    const [minted, mint] = mintRename(state.minted)
    const changeset: Changeset = verb === 'create' ? { command: 'create', title, facts: createFacts(title, mint) } : { command: 'rename', title, facts: renameFacts(title, mint) }
    const [next, call] = write({ ...state, minted, commands: state.commands + 1 }, who, changeset)
    return { ...next, last: { action, by: who, calls: [call] } }
  }
  if (verb === 'sync' && isDevice(who)) {
    let server = state.logs.server
    const calls: Array<Call> = []
    for (const changeset of state.outbox[who]) {
      const [log, outcomes] = accept(server, changeset.facts)
      server = log
      calls.push({ at: 'server', facts: changeset.facts, outcomes })
    }
    const sentLast = state.outbox[who].at(-1)
    const pushed: State = { ...state, logs: { ...state.logs, server }, outbox: { ...state.outbox, [who]: [] }, sent: sentLast ? { by: who, changeset: sentLast } : state.sent }
    const [pulled, call] = pull(pushed, who)
    return { ...pulled, last: { action, by: who, calls: [...calls, call] } }
  }
  const sent = state.sent
  if (sent === null) return state
  if (action === 'sendAgain') {
    // A retry after a lost answer: the same changeset, the same tags.
    const [server, outcomes] = accept(state.logs.server, sent.changeset.facts)
    return { ...state, logs: { ...state.logs, server }, last: { action, by: sent.by, calls: [{ at: 'server', facts: sent.changeset.facts, outcomes }] } }
  }
  // The bug of exercise 01.01: the same changeset, minted again, so every fact has a new tx. The device writes it and syncs.
  const [minted, mint] = mintRename(state.minted)
  const build = sent.changeset.command === 'create' ? createFacts : renameFacts
  const facts = build(sent.changeset.title, mint).map((fact) => ({ ...fact, again: true }))
  const own = ownFacts(facts)
  const [device, deviceOutcomes] = appendAll(state.logs[sent.by], own)
  const [server, serverOutcomes] = accept(state.logs.server, facts)
  const [pulled, call] = pull({ ...state, minted, logs: { ...state.logs, [sent.by]: device, server } }, sent.by)
  return {
    ...pulled,
    last: {
      action,
      by: sent.by,
      calls: [{ at: sent.by, facts: own, outcomes: deviceOutcomes }, { at: 'server', facts, outcomes: serverOutcomes }, call],
    },
  }
}

/** The two counts `LogStore.append` answers with (`AppendResult`). */
export const counts = (outcomes: ReadonlyArray<Outcome>): { readonly inserted: number; readonly duplicates: number } => ({
  inserted: outcomes.filter((outcome) => outcome === 'inserted').length,
  duplicates: outcomes.filter((outcome) => outcome === 'duplicate').length,
})

