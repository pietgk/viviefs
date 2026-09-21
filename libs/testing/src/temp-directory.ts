import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import type * as Scope from 'effect/Scope'

export class TempDirectoryError extends Schema.TaggedError<TempDirectoryError>()(
  'TempDirectoryError',
  { message: Schema.String },
) {}

export const withTempDirectory = (
  prefix: string,
): Effect.Effect<string, TempDirectoryError, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: () => mkdtemp(join(tmpdir(), prefix)),
      catch: (cause) =>
        new TempDirectoryError({ message: String(cause) }),
    }),
    (directory) =>
      Effect.promise(() => rm(directory, { recursive: true, force: true })),
  )
