/**
 * Evidence-collection exemplar. Attribute names pinned by P05 (D44).
 * DeviceResume.v1 is the P07 exemplar workflow.
 */
export {
  Attr,
  CHANGESET_TTL_MS,
  evidenceCatalog,
  evidenceId,
  indexCatalog,
  itemId,
  listId,
  orgId,
  parentId,
} from '@viviefs/datom'
export type { Catalog, ConflictPolicy } from '@viviefs/datom'
export {
  Approval,
  DeviceResume,
  deviceResumeLayer,
  UploadWork,
} from './device-resume.ts'
export {
  DomainError,
  renameList,
  sealItem,
} from './command.ts'
export type { CommandChangeset, CommandMint } from './command.ts'
