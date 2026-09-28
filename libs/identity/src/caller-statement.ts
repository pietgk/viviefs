/**
 * The server's statement about the signed-in provider account (P11 Q22): its
 * person, or none, and the organizations that person may act in. The `Caller`
 * RPC returns it; a device keeps it inside its sign-in session to label its
 * writes. The device never decides who it is.
 */
import * as Schema from 'effect/Schema'
import { ProviderAccount } from './token-verifier.ts'

export const CallerStatement = Schema.Struct({
  person: Schema.NullOr(Schema.String),
  account: ProviderAccount,
  roles: Schema.Array(Schema.String),
  organizations: Schema.Array(Schema.String),
})
export type CallerStatement = typeof CallerStatement.Type
