import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Atom from 'effect/unstable/reactivity/Atom'
import { Attr, keysFor } from '@viviefs/datom'
import type { EvidenceReadModel } from './screen-view.ts'

export class EvidenceReader extends Context.Service<
  EvidenceReader,
  {
    readonly get: (id: string) => Effect.Effect<EvidenceReadModel | null>
  }
>()('viviefs/evidence/EvidenceReader') {}

export const evidenceKeys = (id: string) =>
  keysFor([id], [Attr.captured, Attr.evidenceTitle, Attr.evidenceFile])

export const makeEvidenceAtom = (
  runtime: Atom.AtomRuntime<EvidenceReader>,
  id: string,
) =>
  runtime
    .atom(
      Effect.gen(function* () {
        const reader = yield* EvidenceReader
        return yield* reader.get(id)
      }),
    )
    .pipe(Atom.withReactivity(evidenceKeys(id)))
