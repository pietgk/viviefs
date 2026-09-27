/**
 * Content-hash file store (D43). Bytes stay out of the datom log.
 * A changeset that names a hash commits only after `has` is true.
 * Files are keyed per organization (P11): the same hash in two
 * organizations is two files, and `has` never answers across them.
 * P09 exemplar: in-memory store. Device files and object storage
 * are later implementations of this contract.
 */
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import { sha256Hex } from '@viviefs/datom'

export class BlobHashMismatch extends Schema.TaggedError<BlobHashMismatch>()(
  'BlobHashMismatch',
  { hash: Schema.String },
) {}

export const blobHash = (text: string): Effect.Effect<string, never> =>
  sha256Hex(text).pipe(
    Effect.map((hex) => `blob:${hex}`),
    Effect.orDie,
  )

export class BlobStore extends Context.Service<
  BlobStore,
  {
    readonly put: (
      org: string,
      hash: string,
      text: string,
    ) => Effect.Effect<void, BlobHashMismatch>
    readonly has: (org: string, hash: string) => Effect.Effect<boolean>
  }
>()('viviefs/blobs/BlobStore') {}

export const layerMemory: Layer.Layer<BlobStore> = Layer.sync(BlobStore, () => {
  const files = new Map<string, string>()
  const key = (org: string, hash: string) => JSON.stringify([org, hash])
  return BlobStore.of({
    put: Effect.fn('BlobStore.put')(function* (
      org: string,
      hash: string,
      text: string,
    ) {
      const expected = yield* blobHash(text)
      if (expected !== hash) return yield* new BlobHashMismatch({ hash })
      files.set(key(org, hash), text)
    }),
    has: (org: string, hash: string) => Effect.succeed(files.has(key(org, hash))),
  })
})
