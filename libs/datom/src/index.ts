/**
 * @viviefs/datom: datoms, the hybrid logical clock and the shared `LogStore`.
 *
 * Guide: apps/docs/src/content/docs/guides/log-store/index.mdx
 */
export {
  APPEND_VOLUME,
  FUTURE_SKEW_MS,
  TX_LENGTH,
  TX_PATTERN,
  compareHlc,
  correctedNow,
  decodeHlc,
  encodeHlc,
  fingerprintDevice,
  isTx,
  mintHlc,
  receiveHlc,
} from './hlc.ts'
export type { BootSession, Hlc, ReceiveResult, Tx } from './hlc.ts'
export { deviceLayer, HlcClock, HlcDevice, HlcEntropy } from './clock.ts'
export { cryptoEntropy, liveClock } from './clock-live.ts'
export {
  Datom,
  Envelope,
  FutureSkew,
  InvalidTx,
  Op,
  StoredDatom,
  asTx,
} from './schema.ts'
export type {
  AppendResult,
  CompactResult,
  Cursor,
  Datom as DatomType,
  Envelope as EnvelopeType,
  StoredDatom as StoredDatomType,
} from './schema.ts'
export { LogStore, layer as logStoreLayer } from './log-store.ts'
export { DatomRow, SqlNumber, rowsOf } from './rows.ts'
export { migrateLogStore } from './migrate.ts'
export {
  Attr,
  CHANGESET_TTL_MS,
  SYSTEM_ATTRS,
  isSystemAttr,
} from './vocabulary.ts'
export type { AttrName } from './vocabulary.ts'
export {
  ACCOUNT_ROOT,
  accountIdFromHash,
  activityId,
  ancestorIds,
  ancestorPrefixes,
  clockId,
  decodeIdSegment,
  deferredId,
  encodeIdSegment,
  evidenceId,
  executionId,
  itemId,
  listId,
  membershipId,
  orgId,
  parentId,
  underPrefix,
} from './ids.ts'
export {
  engineCatalog,
  evidenceCatalog,
  identityCatalog,
  indexCatalog,
} from './catalog.ts'
export { accountId } from './account.ts'
export type {
  AttributeLookup,
  AttributeSpec,
  Catalog,
  Composition,
  ConflictPolicy,
  EntityTypeSpec,
} from './catalog.ts'
export {
  CommitManifest,
  ConflictPayload,
  DigestError,
  changesetMembers,
  decodeCommit,
  decodeConflict,
  encodeCommit,
  encodeConflict,
  hashMembers,
  memberCanonical,
  sha256Hex,
} from './manifest.ts'
export { keysFor, keysOverlap } from './keys.ts'
export type { ReactivityKeys } from './keys.ts'
export { migrateReadModels } from './read-models.ts'
export {
  factsByEntityAttr,
  isVisible,
  reduceAll,
  reduceAttribute,
  visibleFacts,
} from './visibility.ts'
export type { StoredFact } from './visibility.ts'
export {
  Projector,
  prefixesOf,
  projectorKeys,
  projectorLayer,
} from './projector.ts'
export type {
  ChangesetStatusName,
  ConflictRow,
  FactQuery,
  ProjectResult,
  ProjectedFact,
  StatusRow,
} from './projector.ts'
