import { Attr } from './vocabulary.ts'

export type ConflictPolicy = 'lww' | 'write-once' | 'human-conflict'

export type Composition = 'root' | 'prefix' | 'reference'

export type AttributeSpec = {
  readonly name: string
  readonly policy: ConflictPolicy
  readonly defining?: boolean
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
        { name: Attr.list, policy: 'lww', defining: true },
        { name: Attr.listTitle, policy: 'lww' },
      ],
    },
    {
      name: 'item',
      defining: Attr.item,
      composition: 'prefix',
      userContent: false,
      attributes: [
        { name: Attr.item, policy: 'lww', defining: true },
        { name: Attr.itemTitle, policy: 'lww' },
        { name: Attr.itemSeal, policy: 'write-once' },
      ],
    },
    {
      name: 'evidence',
      defining: Attr.captured,
      composition: 'reference',
      ownerAttribute: Attr.evidenceOwner,
      userContent: true,
      attributes: [
        { name: Attr.captured, policy: 'lww', defining: true },
        { name: Attr.evidenceTitle, policy: 'lww' },
        { name: Attr.evidenceFile, policy: 'human-conflict' },
        { name: Attr.evidenceOwner, policy: 'human-conflict' },
      ],
    },
  ],
}

/**
 * Engine journal catalog pinned by P06. Journal facts are write-once.
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
        { name: Attr.workflowStarted, policy: 'write-once', defining: true },
        { name: Attr.workflowResult, policy: 'write-once' },
        { name: Attr.leaseHolder, policy: 'lww' },
      ],
    },
    {
      name: 'activity',
      defining: Attr.activityExit,
      composition: 'prefix',
      userContent: false,
      attributes: [
        { name: Attr.activityExit, policy: 'write-once', defining: true },
      ],
    },
    {
      name: 'deferred',
      defining: Attr.deferredExit,
      composition: 'prefix',
      userContent: false,
      attributes: [
        { name: Attr.deferredExit, policy: 'write-once', defining: true },
      ],
    },
    {
      name: 'clock',
      defining: Attr.clockWakeAt,
      composition: 'prefix',
      userContent: false,
      attributes: [
        { name: Attr.clockWakeAt, policy: 'write-once', defining: true },
      ],
    },
  ],
}
