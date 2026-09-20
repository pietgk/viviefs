import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import { isSystemAttr } from './vocabulary.ts'
import type { Datom } from './schema.ts'

export const CommitManifest = Schema.Struct({
  n: Schema.Number,
  hash: Schema.String,
  basis: Schema.Number,
  files: Schema.Array(Schema.String),
})
export type CommitManifest = typeof CommitManifest.Type

export const ConflictPayload = Schema.Struct({
  e: Schema.String,
  a: Schema.String,
  kind: Schema.Literals(['concurrent', 'orphan']),
  values: Schema.Array(
    Schema.Struct({
      v: Schema.String,
      cs: Schema.String,
      commitTx: Schema.String,
    }),
  ),
  owner: Schema.NullOr(Schema.String),
})
export type ConflictPayload = typeof ConflictPayload.Type

const ConflictJson = Schema.fromJsonString(ConflictPayload)

export const encodeConflict = (payload: ConflictPayload): string =>
  Schema.encodeSync(ConflictJson)(payload)

export const decodeConflict = (value: string): ConflictPayload | null =>
  Option.getOrNull(Schema.decodeUnknownOption(ConflictJson)(value))

export class DigestError extends Schema.TaggedError<DigestError>()(
  'DigestError',
  { message: Schema.String },
) {}

const hexFromBuffer = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let out = ''
  for (let index = 0; index < bytes.length; index++) {
    out += (bytes[index] ?? 0).toString(16).padStart(2, '0')
  }
  return out
}

export const sha256Hex = (
  text: string,
): Effect.Effect<string, DigestError> => {
  const bytes = new TextEncoder().encode(text)
  return Effect.tryPromise({
    try: () => crypto.subtle.digest('SHA-256', bytes),
    catch: (cause) => new DigestError({ message: String(cause) }),
  }).pipe(Effect.map(hexFromBuffer))
}

export const memberCanonical = (datom: Datom): string =>
  JSON.stringify([datom.e, datom.a, datom.v, datom.tx, datom.op, datom.cs])

export const changesetMembers = (
  datoms: ReadonlyArray<Datom>,
): ReadonlyArray<Datom> =>
  datoms
    .filter((datom) => !isSystemAttr(datom.a))
    .slice()
    .sort((left, right) =>
      left.tx < right.tx
        ? -1
        : left.tx > right.tx
          ? 1
          : left.e < right.e
            ? -1
            : left.e > right.e
              ? 1
              : left.a < right.a
                ? -1
                : left.a > right.a
                  ? 1
                  : 0,
    )

export const hashMembers = (
  datoms: ReadonlyArray<Datom>,
): Effect.Effect<string, DigestError> =>
  sha256Hex(changesetMembers(datoms).map(memberCanonical).join('\n'))

const CommitJson = Schema.fromJsonString(CommitManifest)

export const encodeCommit = (manifest: CommitManifest): string =>
  Schema.encodeSync(CommitJson)(manifest)

export const decodeCommit = (value: string): CommitManifest | null =>
  Option.getOrNull(Schema.decodeUnknownOption(CommitJson)(value))
