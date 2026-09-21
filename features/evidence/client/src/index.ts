import { atomDriver } from './capture/atom.ts'
import { brokenDriver } from './capture/broken.ts'
import {
  allPassed,
  CAPTURE_CHECK_NAMES,
  runCaptureChecks,
} from './capture/checks.ts'
import type { CaptureDriver } from './capture/driver.ts'
import { effectMachineDriver } from './capture/effect-machine.ts'
import {
  EvidenceReader,
  evidenceKeys,
  makeEvidenceAtom,
} from './capture/query-atom.ts'
import { selectCaptureScreen } from './capture/screen-view.ts'
import { xstateDriver } from './capture/xstate.ts'

export const passingDrivers: ReadonlyArray<CaptureDriver> = [
  xstateDriver,
  effectMachineDriver,
  atomDriver,
]

export {
  allPassed,
  atomDriver,
  brokenDriver,
  CAPTURE_CHECK_NAMES,
  effectMachineDriver,
  EvidenceReader,
  evidenceKeys,
  makeEvidenceAtom,
  runCaptureChecks,
  selectCaptureScreen,
  xstateDriver,
}

export type { CaptureCheck } from './capture/checks.ts'
export type { CaptureDriver } from './capture/driver.ts'
