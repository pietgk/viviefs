/**
 * Sync client adapter. P09 exemplar: outbox, cursor, Effect RPC. P11: the
 * client half of bearer authentication attaches the sign-in session's token.
 */
export {
  SyncClient,
  SyncRpc,
  bearerAuthenticationClient,
  syncClientLayer,
  syncRpcLayer,
} from './client.ts'
export type { Outgoing, PushResult, Unauthenticated } from './client.ts'
