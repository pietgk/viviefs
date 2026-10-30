import * as Schema from 'effect/Schema'
import type { ValueSchema } from './values.ts'
import { Attr } from './vocabulary.ts'

export type ConflictPolicy = 'lww' | 'write-once' | 'human-conflict'

export type Composition = 'root' | 'prefix' | 'reference'

export type AttributeSpec = {
  readonly name: string
  /** What a value is: its type, range and description (D209). */
  readonly value: ValueSchema
  readonly policy: ConflictPolicy
  readonly defining?: boolean
  /** `server`: only server-authored changesets may write it (P11). */
  readonly authority?: 'server'
}

export type EntityTypeSpec = {
  readonly name: string
  readonly defining: string
  readonly composition: Composition
  readonly ownerAttribute?: string
  readonly userContent: boolean
  readonly attributes: ReadonlyArray<AttributeSpec>
}

export type Catalog = {
  readonly types: ReadonlyArray<EntityTypeSpec>
}

export type AttributeLookup = {
  readonly type: EntityTypeSpec
  readonly spec: AttributeSpec
}

const text = (description: string) => Schema.String.annotate({ description })

/** A file by content hash (D43). */
const blobHash = (description: string) =>
  Schema.String.check(Schema.isPattern(/^blob:[0-9a-f]{64}$/)).annotate({
    description,
  })

export const indexCatalog = (
  catalog: Catalog,
): {
  readonly byAttr: ReadonlyMap<string, AttributeLookup>
  readonly byDefining: ReadonlyMap<string, EntityTypeSpec>
} => {
  const byAttr = new Map<string, AttributeLookup>()
  const byDefining = new Map<string, EntityTypeSpec>()
  for (const type of catalog.types) {
    byDefining.set(type.defining, type)
    for (const spec of type.attributes) {
      byAttr.set(spec.name, { type, spec })
    }
  }
  return { byAttr, byDefining }
}

/**
 * P05 probe catalog and the evidence exemplar vocabulary. Defining
 * attributes are LWW so retract / re-assert can restore an entity.
 */
export const evidenceCatalog: Catalog = {
  types: [
    {
      name: 'list',
      defining: Attr.list,
      composition: 'prefix',
      userContent: false,
      attributes: [
        { name: Attr.list, value: text('A list exists while this is asserted.'), policy: 'lww', defining: true },
        { name: Attr.listTitle, value: text('The name of the list.'), policy: 'lww' },
      ],
    },
    {
      name: 'item',
      defining: Attr.item,
      composition: 'prefix',
      userContent: false,
      attributes: [
        { name: Attr.item, value: text('An item exists in its list while this is asserted.'), policy: 'lww', defining: true },
        { name: Attr.itemTitle, value: text('What the item asks for.'), policy: 'lww' },
        { name: Attr.itemSeal, value: text('A seal on the item, written once.'), policy: 'write-once' },
      ],
    },
    {
      name: 'evidence',
      defining: Attr.captured,
      composition: 'reference',
      ownerAttribute: Attr.evidenceOwner,
      userContent: true,
      attributes: [
        { name: Attr.captured, value: text('A piece of evidence exists while this is asserted.'), policy: 'lww', defining: true },
        { name: Attr.evidenceTitle, value: text('The title of the evidence.'), policy: 'lww' },
        { name: Attr.evidenceFile, value: blobHash('The content hash of the evidence file.'), policy: 'human-conflict' },
        { name: Attr.evidenceOwner, value: text('The entity that owns the evidence.'), policy: 'human-conflict' },
      ],
    },
  ],
}

/**
 * Workflow engine journal catalog pinned by P06; P10 added the activity start fact
 * so a derived span has a measured start. Journal facts are write-once.
 * Lease holder is LWW so a later epoch can replace the previous holder;
 * fencing is by epoch, not by projector write-once.
 */
export const engineCatalog: Catalog = {
  types: [
    {
      name: 'execution',
      defining: Attr.workflowStarted,
      composition: 'prefix',
      userContent: false,
      attributes: [
        { name: Attr.workflowStarted, value: text('The workflow name and payload, as JSON text from the engine.'), policy: 'write-once', defining: true },
        { name: Attr.workflowResult, value: text('The workflow exit, as JSON text from the engine.'), policy: 'write-once' },
        { name: Attr.leaseHolder, value: text('The lease holder, as JSON text from the engine.'), policy: 'lww' },
      ],
    },
    {
      name: 'activity',
      defining: Attr.activityExit,
      composition: 'prefix',
      userContent: false,
      attributes: [
        { name: Attr.activityExit, value: text('The activity exit, as JSON text from the engine.'), policy: 'write-once', defining: true },
        { name: Attr.activityStarted, value: text('The activity name and attempt, as JSON text from the engine.'), policy: 'write-once' },
      ],
    },
    {
      name: 'deferred',
      defining: Attr.deferredExit,
      composition: 'prefix',
      userContent: false,
      attributes: [
        { name: Attr.deferredExit, value: text('The durable deferred exit, as JSON text from the engine.'), policy: 'write-once', defining: true },
      ],
    },
    {
      name: 'clock',
      defining: Attr.clockWakeAt,
      composition: 'prefix',
      userContent: false,
      attributes: [
        { name: Attr.clockWakeAt, value: text('The durable clock, as JSON text from the engine.'), policy: 'write-once', defining: true },
      ],
    },
  ],
}

/**
 * Identity catalog pinned by P11 (ADR-0022). Every attribute is server-only.
 * The account entity `A{sha256(iss, sub)}` lives under a server-only root and
 * never leaves the server; an account never changes person. Membership
 * `O{org}/M{person}` syncs with its organization; retracting the defining
 * attribute revokes it.
 */
export const identityCatalog: Catalog = {
  types: [
    {
      name: 'account',
      defining: Attr.accountPerson,
      composition: 'root',
      userContent: false,
      attributes: [
        {
          name: Attr.accountPerson,
          value: text('The person this account signs in as.'),
          policy: 'write-once',
          defining: true,
          authority: 'server',
        },
        { name: Attr.accountIssuer, value: text('The identity provider that issued this account.'), policy: 'write-once', authority: 'server' },
        { name: Attr.accountSubject, value: text('The subject the identity provider gives this account.'), policy: 'write-once', authority: 'server' },
      ],
    },
    {
      name: 'membership',
      defining: Attr.membershipGranted,
      composition: 'prefix',
      userContent: false,
      attributes: [
        {
          name: Attr.membershipGranted,
          value: text('The person holding this membership.'),
          policy: 'lww',
          defining: true,
          authority: 'server',
        },
      ],
    },
  ],
}
