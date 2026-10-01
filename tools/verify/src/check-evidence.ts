/**
 * verify quality / evidence: judges this verify run's coverage producers
 * against the registry and the evidence lockfile (`evidence.ts`).
 */
import { SUITES } from '@viviefs/testing'
import { REGISTRY } from './evidence-registry.ts'
import { loadRuns, readLockfile } from './evidence-artifacts.ts'
import { judgeEvidence } from './evidence.ts'
import { registryDigest } from './lockfile.ts'

const run = process.env.VIVIEFS_VERIFY_RUN
if (!run) {
  throw new Error('The evidence step judges one verify run; run it through `pnpm verify`.')
}

const runs = loadRuns(run)
const { issues, tuples } = judgeEvidence({
  registry: REGISTRY,
  digest: registryDigest(REGISTRY),
  suites: SUITES,
  runs,
  lockfile: readLockfile(),
})

if (issues.length > 0) {
  const hint = Object.keys(runs).length < 3
    ? '\nThe evidence step needs unit, integration and storybook in the same run: `pnpm verify unit integration storybook evidence`.'
    : ''
  throw new Error(`Evidence does not hold:\n${issues.map((line) => `  ${line}`).join('\n')}${hint}`)
}

const exact = Object.values(tuples).reduce((sum, files) => sum + Object.keys(files).length, 0)
console.log(
  `Evidence: ${REGISTRY.length} files judged; ${exact} exact coverage tuples match the lockfile; ` +
    `${SUITES.filter((suite) => !suite.labOnly).length} suites ran.`,
)
