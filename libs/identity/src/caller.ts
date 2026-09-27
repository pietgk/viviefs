/**
 * The verified requester of one server request. Bearer authentication
 * provides it after verifying the access token and mapping the provider
 * account to a person. Handlers read it; they never read identity from a
 * payload.
 */
import * as Context from 'effect/Context'
import type { ProviderAccount } from './token-verifier.ts'

export class Caller extends Context.Service<
  Caller,
  {
    readonly person: string
    readonly account: ProviderAccount
    readonly roles: ReadonlyArray<string>
  }
>()('viviefs/identity/Caller') {}
