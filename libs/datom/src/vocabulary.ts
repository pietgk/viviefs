/**
 * Attribute names pinned by P05, P06 and P10 (D44). A shipped name cannot be
 * renamed or retyped.
 *
 * Domain names are the evidence-collection exemplar. System names are the
 * changeset control vocabulary and the workflow-engine journal.
 */
export const CHANGESET_TTL_MS = 86_400_000

export const Attr = {
  changesetCommit: 'viviefs/changeset/commit',
  changesetAbort: 'viviefs/changeset/abort',
  conflict: 'viviefs/conflict',
  workflowStarted: 'viviefs/workflow/started',
  workflowResult: 'viviefs/workflow/result',
  activityStarted: 'viviefs/activity/started',
  activityExit: 'viviefs/activity/exit',
  deferredExit: 'viviefs/deferred/exit',
  clockWakeAt: 'viviefs/clock/wake-at',
  leaseHolder: 'viviefs/lease/holder',
  accountPerson: 'viviefs/account/person',
  accountIssuer: 'viviefs/account/issuer',
  accountSubject: 'viviefs/account/subject',
  membershipGranted: 'viviefs/membership/granted',
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
  Attr.workflowStarted,
  Attr.workflowResult,
  Attr.activityStarted,
  Attr.activityExit,
  Attr.deferredExit,
  Attr.clockWakeAt,
  Attr.leaseHolder,
  Attr.accountPerson,
  Attr.accountIssuer,
  Attr.accountSubject,
  Attr.membershipGranted,
])

export const isSystemAttr = (attribute: string): boolean =>
  SYSTEM_ATTRS.has(attribute)

