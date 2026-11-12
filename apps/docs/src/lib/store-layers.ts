/**
 * The model behind lesson 4's widget (D216): a log store composed from
 * Layers, and what `log-store/conformance` says of it. `logStoreLayer` is
 * written once against `SqlClient` and needs four services; a store gives it
 * a database and two of the others, and leaves the clock to whoever runs it
 * (an app gives `liveClock`, the suite a clock it controls). Pure.
 * `store-layers.integration.test.ts` runs the real suite on every database
 * Node can host and checks that it fails exactly what the model says.
 */

export const CHECKS = [
  'append',
  'duplicate append',
  'acceptance time',
  'hlc mint',
  'hlc backwards clock',
  'hlc reboot',
  'hlc remote-ahead',
  'hlc future skew',
  'cursor streaming',
  'prefix scans',
  'acknowledged cursor',
  'volume',
] as const

export type Database = {
  readonly id: 'sqlite-file' | 'sqlite-memory' | 'pglite-dir' | 'pglite-memory' | 'op-sqlite' | 'sqlite-wasm'
  readonly label: string
  /** The `SqlClient` Layer, as code. */
  readonly layer: string
  /** Whether what it stores outlives a restart. */
  readonly keeps: boolean
  /** Whether Node can run the suite on it here; the others are run by P04 on a device or in a browser. */
  readonly here: boolean
}

export const DATABASES: ReadonlyArray<Database> = [
  { id: 'sqlite-file', label: 'SQLite on a file', layer: "sqliteNodeLayer(join(directory, 'log.sqlite'))", keeps: true, here: true },
  { id: 'sqlite-memory', label: 'SQLite in memory', layer: "sqliteNodeLayer(':memory:')", keeps: false, here: true },
  { id: 'pglite-dir', label: 'PGlite on a folder', layer: "pgliteClientLayer(join(directory, 'pg'))", keeps: true, here: true },
  { id: 'pglite-memory', label: 'PGlite in memory', layer: 'pgliteClientLayer()', keeps: false, here: true },
  { id: 'op-sqlite', label: 'op-sqlite on iOS and Android', layer: 'opSqliteLayer(name)', keeps: true, here: false },
  { id: 'sqlite-wasm', label: 'SQLite wasm in a browser (OPFS)', layer: 'sqliteWasmLayer(worker)', keeps: true, here: false },
]

/** The pieces besides the database, the service each one gives, and its Layer. */
export const PIECES = [
  { id: 'entropy', service: 'HlcEntropy', layer: 'cryptoEntropy' },
  { id: 'device', service: 'HlcDevice', layer: "deviceLayer('learner')" },
] as const
export type Piece = (typeof PIECES)[number]['id']

export type Status = 'PASS' | 'FAIL'
export type Run = { readonly database: Database['id']; readonly results: ReadonlyArray<{ readonly name: string; readonly status: Status }> }

export type State = { readonly database: Database['id']; readonly pieces: ReadonlyArray<Piece>; readonly run: Run | null }

export const initial: State = { database: 'sqlite-memory', pieces: [], run: null }

export const databaseOf = (id: Database['id']): Database => DATABASES.find((database) => database.id === id) ?? DATABASES[0]!

/** What `logStoreLayer` still needs after the pieces given: the R slot the compiler shows. */
export const needs = (state: State): ReadonlyArray<string> => [...PIECES.filter(({ id }) => !state.pieces.includes(id)).map(({ service }) => service), 'HlcClock']

/** The composition as code, the way a store's own file writes it, and what its R slot still holds. */
export const code = (state: State): string =>
  [
    'const store = logStoreLayer.pipe(',
    `  Layer.provideMerge(${databaseOf(state.database).layer}),`,
    ...PIECES.filter(({ id }) => state.pieces.includes(id)).map(({ layer }) => `  Layer.provide(${layer}),`),
    ')',
    needs(state).length === 1 ? '// still needs HlcClock: whoever runs the store gives it' : `// still needs ${needs(state).join(', ')}`,
  ].join('\n')

/** Whether the suite can run it: everything but the clock is given, and Node can host the database. */
export const canRun = (state: State): boolean => needs(state).length === 1 && databaseOf(state.database).here

// #region conformance
/** What the suite says: a store that forgets on a restart cannot keep its clock from going back. */
export const conformance = (database: Database): Run['results'] =>
  CHECKS.map((name) => ({ name, status: database.keeps || name !== 'hlc reboot' ? 'PASS' : 'FAIL' }))
// #endregion conformance

export type Action = { readonly kind: 'database'; readonly id: Database['id'] } | { readonly kind: 'piece'; readonly id: Piece } | { readonly kind: 'run' } | { readonly kind: 'reset' }

export const step = (state: State, action: Action): State => {
  switch (action.kind) {
    case 'database':
      return { ...state, database: action.id, run: null }
    case 'piece':
      return { ...state, pieces: state.pieces.includes(action.id) ? state.pieces.filter((id) => id !== action.id) : [...state.pieces, action.id], run: null }
    case 'run':
      return canRun(state) ? { ...state, run: { database: state.database, results: conformance(databaseOf(state.database)) } } : state
    case 'reset':
      return initial
  }
}
