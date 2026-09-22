/**
 * Shared commands (D36). Pure: the same function runs on a device
 * and on the server. The sync server validates the changeset it
 * produces; it does not grow a second write path.
 */
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import {
  Attr,
  encodeCommit,
  hashMembers,
  itemId,
  listId,
  type DatomType,
  type EnvelopeType,
} from '@viviefs/datom'

export class DomainError extends Schema.TaggedError<DomainError>()(
  'DomainError',
  { message: Schema.String },
) {}

export type CommandChangeset = {
  readonly org: string
  readonly basis: number
  readonly envelope: EnvelopeType
  readonly datoms: ReadonlyArray<DatomType>
}

export type CommandMint = {
  readonly cs: string
  readonly memberTx: string
  readonly extraTx: string
  readonly commitTx: string
  readonly actor: string
  readonly device: string
  readonly basis: number
}

const envelopeFor = (mint: CommandMint, command: string): EnvelopeType => ({
  cs: mint.cs,
  actor: mint.actor,
  device: mint.device,
  leaseEpoch: null,
  traceId: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  spanId: 'ffffffffffffffff',
  sampled: false,
  command,
})

const finish = (
  org: string,
  mint: CommandMint,
  command: string,
  members: ReadonlyArray<DatomType>,
): Effect.Effect<CommandChangeset, DomainError> =>
  Effect.gen(function* () {
    const hash = yield* hashMembers(members).pipe(Effect.orDie)
    const commit: DatomType = {
      e: mint.cs,
      a: Attr.changesetCommit,
      v: encodeCommit({
        n: members.length,
        hash,
        basis: mint.basis,
        files: [],
      }),
      tx: mint.commitTx,
      op: 'assert',
      cs: mint.cs,
    }
    return {
      org,
      basis: mint.basis,
      envelope: envelopeFor(mint, command),
      datoms: [...members, commit],
    }
  })

export const renameList = (
  read: { readonly title: string | null },
  intent: {
    readonly org: string
    readonly list: string
    readonly title: string
  },
  mint: CommandMint,
): Effect.Effect<CommandChangeset, DomainError> => {
  if (intent.title.trim().length === 0) {
    return Effect.fail(new DomainError({ message: 'blank title' }))
  }
  if (read.title === intent.title) {
    return Effect.fail(new DomainError({ message: 'unchanged title' }))
  }
  const entity = listId(intent.org, intent.list)
  const members: ReadonlyArray<DatomType> = [
    {
      e: entity,
      a: Attr.list,
      v: '1',
      tx: mint.memberTx,
      op: 'assert',
      cs: mint.cs,
    },
    {
      e: entity,
      a: Attr.listTitle,
      v: intent.title,
      tx: mint.extraTx,
      op: 'assert',
      cs: mint.cs,
    },
  ]
  return finish(intent.org, mint, 'evidence.renameList', members)
}

export const sealItem = (
  intent: {
    readonly org: string
    readonly list: string
    readonly item: string
    readonly seal: string
  },
  mint: CommandMint,
): Effect.Effect<CommandChangeset, DomainError> => {
  if (intent.seal.trim().length === 0) {
    return Effect.fail(new DomainError({ message: 'blank seal' }))
  }
  const entity = itemId(intent.org, intent.list, intent.item)
  const members: ReadonlyArray<DatomType> = [
    {
      e: entity,
      a: Attr.item,
      v: '1',
      tx: mint.memberTx,
      op: 'assert',
      cs: mint.cs,
    },
    {
      e: entity,
      a: Attr.itemSeal,
      v: intent.seal,
      tx: mint.extraTx,
      op: 'assert',
      cs: mint.cs,
    },
  ]
  return finish(intent.org, mint, 'evidence.sealItem', members)
}
