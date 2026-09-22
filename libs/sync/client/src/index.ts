/**
 * Sync client adapter. P09 exemplar: outbox, cursor, Effect RPC.
 */
export {
  SyncClient,
  SyncRpc,
  syncClientLayer,
  syncRpcLayer,
} from './client.ts'
export type { Outgoing, PushResult } from './client.ts'
