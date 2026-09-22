/**
 * Content-hash file store (D43). Bytes stay out of the datom log.
 * A changeset that names a hash commits only after `has` is true.
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
      hash: string,
      text: string,
    ) => Effect.Effect<void, BlobHashMismatch>
    readonly has: (hash: string) => Effect.Effect<boolean>
  }
>()('viviefs/blobs/BlobStore') {}

export const layerMemory: Layer.Layer<BlobStore> = Layer.sync(BlobStore, () => {
  const files = new Map<string, string>()
  return BlobStore.of({
    put: Effect.fn('BlobStore.put')(function* (hash: string, text: string) {
      const expected = yield* blobHash(text)
      if (expected !== hash) return yield* new BlobHashMismatch({ hash })
      files.set(hash, text)
    }),
    has: (hash: string) => Effect.succeed(files.has(hash)),
  })
})
