/**
 * Account entity id (P11, ADR-0022): deterministic from the provider account,
 * so looking up a caller is one read by entity id. The JSON pair keeps
 * issuer and subject unambiguous.
 */
import * as Effect from 'effect/Effect'
import { accountIdFromHash } from './ids.ts'
import { sha256Hex, type DigestError } from './manifest.ts'

export const accountId = (account: {
  readonly issuer: string
  readonly subject: string
}): Effect.Effect<string, DigestError> =>
  sha256Hex(JSON.stringify([account.issuer, account.subject])).pipe(
    Effect.map(accountIdFromHash),
  )
