/**
 * Sync client adapter. P09 exemplar: outbox, cursor, Effect RPC. P11: the
 * client half of bearer authentication attaches the sign-in session's token,
 * and each provider account gets its own local replica.
 */
export {
  SyncClient,
  SyncRpc,
  bearerAuthenticationClient,
  callerStatementsLayer,
  syncClientLayer,
  syncRpcClientLayer,
  syncRpcLayer,
} from './client.ts'
export type {
  NotDelivered,
  Outgoing,
  PushResult,
  Unauthenticated,
} from './client.ts'
export { replicaName } from './replica.ts'
