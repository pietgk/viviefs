/**
 * OPFS worker body and database deletion on web. Every database of an
 * origin lives in one pool of OPFS access handles (wa-sqlite's
 * `AccessHandlePoolVFS`), and only one worker can hold the pool at a time.
 * So a database is deleted by a worker of its own, started after the log
 * store's worker has been terminated.
 *
 * A worker is told what to do by its name, the only thing it has before its
 * first message: a database name opens that database; `delete:` and a
 * database name deletes it and reports back.
 */
import SQLiteESMFactory from '@effect/wa-sqlite/dist/wa-sqlite.mjs'
import { AccessHandlePoolVFS } from '@effect/wa-sqlite/src/examples/AccessHandlePoolVFS.js'
import * as OpfsWorker from '@effect/sql-sqlite-wasm/OpfsWorker'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

export class DatabaseNotDeleted extends Schema.TaggedError<DatabaseNotDeleted>()(
  'DatabaseNotDeleted',
  { filename: Schema.String, reason: Schema.String },
) {}

const DELETE = 'delete:'
const DELETED = 'viviefs/opfs/deleted'

// SQLite's own files next to a database; the pool keeps each as its own file.
const SIDE_FILES = ['', '-journal', '-wal']

/**
 * wa-sqlite's VFS allows 64 characters per path, and SQLite opens
 * `<name>-journal` next to a database. A longer name fails inside the worker.
 */
export const OPFS_MAX_NAME_LENGTH = 64 - 1 - '-journal'.length

const deleteInWorker = async (dbName: string) => {
  const module = await SQLiteESMFactory()
  const vfs = await AccessHandlePoolVFS.create('opfs', module)
  for (const suffix of SIDE_FILES) vfs.jDelete(`${dbName}${suffix}`, 0)
  await vfs.close()
}

/** A dedicated worker's global scope, as the port OpfsWorker talks through. */
export type WorkerPort = MessagePort & EventTarget & { close: () => void }

/**
 * The worker's own global scope as a port. Call it only inside a worker.
 */
export const workerPort = (): WorkerPort =>
  // eslint-disable-next-line no-restricted-syntax -- D79 exception: inside a worker `self` is a DedicatedWorkerGlobalScope, but this project compiles against the DOM lib, which types `self` as Window.
  self as unknown as WorkerPort

/** The body of an OPFS worker. Call it once from the worker module. */
export const runOpfsWorker = (): void => {
  const port = workerPort()
  const name = self.name
  if (name.startsWith(DELETE)) {
    void deleteInWorker(name.slice(DELETE.length)).then(
      () => port.postMessage(DELETED),
      (error: unknown) => port.postMessage(String(error)),
    )
    return
  }
  // A failure inside the worker never reaches the log store's client on its
  // own: log it, and raise it so the worker's `error` event fires.
  const fail = (message: string) => {
    console.error(message)
    setTimeout(() => {
      throw new Error(message)
    })
  }
  if (name.length > OPFS_MAX_NAME_LENGTH) {
    fail(`OPFS database name longer than ${OPFS_MAX_NAME_LENGTH}: ${name}`)
    return
  }
  Effect.runFork(
    OpfsWorker.run({ port, dbName: name }).pipe(
      Effect.catchCause((cause) =>
        Effect.sync(() => fail(`OPFS worker for ${name}: ${Cause.pretty(cause)}`)),
      ),
    ),
  )
}

/** A worker named `name`, from the app's worker module (a static URL for the bundler). */
export type OpfsWorkerFactory = (name: string) => Worker

/**
 * Deletes one database from the pool. Its log store must be closed: the
 * deleting worker cannot take the pool while another worker holds it.
 */
export const deleteOpfsDatabase = (
  worker: OpfsWorkerFactory,
  dbName: string,
): Effect.Effect<void, DatabaseNotDeleted> =>
  Effect.acquireUseRelease(
    Effect.sync(() => worker(`${DELETE}${dbName}`)),
    (running) =>
      Effect.callback<void, DatabaseNotDeleted>((resume) => {
        running.onmessage = (event: MessageEvent) => {
          resume(
            event.data === DELETED
              ? Effect.void
              : Effect.fail(
                  new DatabaseNotDeleted({
                    filename: dbName,
                    reason: String(event.data),
                  }),
                ),
          )
        }
      }),
    (running) => Effect.sync(() => running.terminate()),
  )
