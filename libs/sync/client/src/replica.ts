/**
 * One local replica per provider account (P11 Q11, amended): a device opens
 * a separate database for each account that signs in on it, so one person
 * never sees another's data or outbox. The name is a hash of the account,
 * known before the server names a person, and reveals neither issuer nor
 * subject in a file listing. 96 bits of the hash keep two accounts apart
 * and leave room under SQLite's 64-character path limit on web.
 */
import * as Effect from 'effect/Effect'
import { sha256Hex, type DigestError } from '@viviefs/datom'
import type { ProviderAccount } from '@viviefs/identity'

export const replicaName = (
  account: ProviderAccount,
): Effect.Effect<string, DigestError> =>
  sha256Hex(JSON.stringify([account.issuer, account.subject])).pipe(
    Effect.map((hash) => `viviefs-${hash.slice(0, 24)}`),
  )
