/**
 * Attribute names pinned by P05 (D44). A shipped name cannot be renamed or
 * retyped. Engine journal attributes wait for P06.
 *
 * Domain names are the evidence-collection exemplar. System names are the
 * changeset control vocabulary.
 */
export const CHANGESET_TTL_MS = 86_400_000

export const Attr = {
  changesetCommit: 'viviefs/changeset/commit',
  changesetAbort: 'viviefs/changeset/abort',
  conflict: 'viviefs/conflict',
  list: 'evidence/list',
  listTitle: 'evidence/list/title',
  item: 'evidence/item',
  itemTitle: 'evidence/item/title',
  itemSeal: 'evidence/item/seal',
  captured: 'evidence/captured',
  evidenceTitle: 'evidence/title',
  evidenceFile: 'evidence/file',
  evidenceOwner: 'evidence/owner',
} as const

export type AttrName = (typeof Attr)[keyof typeof Attr]

export const SYSTEM_ATTRS: ReadonlySet<string> = new Set([
  Attr.changesetCommit,
  Attr.changesetAbort,
  Attr.conflict,
])

export const isSystemAttr = (attribute: string): boolean =>
  SYSTEM_ATTRS.has(attribute)
