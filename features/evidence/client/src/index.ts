import { atomDriver } from './intent-composer/atom.ts'
import { brokenDriver } from './intent-composer/broken.ts'
import {
  allPassed,
  COMPOSER_CHECK_NAMES,
  runComposerChecks,
} from './intent-composer/checks.ts'
import type { ComposerDriver } from './intent-composer/driver.ts'
import { effectMachineDriver } from './intent-composer/effect-machine.ts'
import { intentComposerMermaid } from './intent-composer/graph.ts'
import {
  EvidenceReader,
  evidenceKeys,
  makeEvidenceAtom,
} from './intent-composer/query-atom.ts'
import { selectIntentComposer } from './intent-composer/screen-view.ts'
import { xstateDriver } from './intent-composer/xstate.ts'

export const passingDrivers: ReadonlyArray<ComposerDriver> = [
  xstateDriver,
  effectMachineDriver,
  atomDriver,
]

export {
  allPassed,
  atomDriver,
  brokenDriver,
  COMPOSER_CHECK_NAMES,
  effectMachineDriver,
  EvidenceReader,
  evidenceKeys,
  intentComposerMermaid,
  makeEvidenceAtom,
  runComposerChecks,
  selectIntentComposer,
  xstateDriver,
}

export type { ComposerCheck } from './intent-composer/checks.ts'
export type { ComposerDriver } from './intent-composer/driver.ts'
