import { describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Atom from 'effect/unstable/reactivity/Atom'
import * as AtomRegistry from 'effect/unstable/reactivity/AtomRegistry'
import * as AsyncResult from 'effect/unstable/reactivity/AsyncResult'
import { evidenceId } from '@viviefs/datom'
import {
  EvidenceReader,
  evidenceKeys,
  makeEvidenceAtom,
} from './query-atom.ts'
import type { EvidenceReadModel } from './screen-view.ts'

const id = evidenceId('org', '1')

const titleOf = (value: unknown): string | undefined => {
  if (!AsyncResult.isAsyncResult(value) || !AsyncResult.isSuccess(value)) {
    return undefined
  }
  const model = value.value as EvidenceReadModel | null
  return model?.title
}

describe('evidence query atom', () => {
  it('declares prefix and attribute invalidation keys', () => {
    expect(evidenceKeys(id)).toContain('prefix:Oorg/E1')
    expect(evidenceKeys(id)).toContain('prefix:Oorg')
    expect(evidenceKeys(id)).toContain('attribute:evidence/captured')
    expect(evidenceKeys(id)).toContain('attribute:evidence/title')
    expect(evidenceKeys(id)).toContain('attribute:evidence/file')
  })

  it('re-queries after invalidation of those keys', async () => {
    const slot: { current: EvidenceReadModel | null } = {
      current: {
        id,
        title: 'before',
        fileHash: null,
        captured: false,
      },
    }
    const runtime = Atom.runtime(
      Layer.succeed(EvidenceReader, {
        get: () => Effect.sync(() => slot.current),
      }),
    )
    const atom = makeEvidenceAtom(runtime, id)
    const bump = runtime.fn(() => Effect.void, {
      reactivityKeys: evidenceKeys(id),
    })
    const registry = AtomRegistry.make()
    registry.mount(atom)
    expect(titleOf(registry.get(atom))).toBe('before')

    slot.current = {
      id,
      title: 'after',
      fileHash: 'blob:1',
      captured: true,
    }
    registry.set(bump, undefined)
    await Effect.runPromise(Effect.yieldNow)
    expect(titleOf(registry.get(atom))).toBe('after')
    registry.dispose()
  })
})
