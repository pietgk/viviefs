import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Effect from 'effect/Effect'
import {
  allPassed,
  atomDriver,
  brokenDriver,
  effectMachineDriver,
  runCaptureChecks,
  xstateDriver,
  type CaptureCheck,
} from '@viviefs/evidence-client'
import { fail, writeJson } from './dev-client.ts'
import { command } from '../process.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p08')
const CLIENT = join(ROOT, 'features/evidence/client')
const UI = join(ROOT, 'libs/ui')

const VARIANTS = [xstateDriver, effectMachineDriver, atomDriver] as const

const VARIANT_FILES = {
  xstate: 'features/evidence/client/src/capture/xstate.ts',
  'effect-machine': 'features/evidence/client/src/capture/effect-machine.ts',
  atom: 'features/evidence/client/src/capture/atom.ts',
} as const

const requirePass = (checks: ReadonlyArray<CaptureCheck>, label: string) => {
  const failed = checks.filter((entry) => entry.status !== 'PASS')
  if (failed.length > 0) {
    fail(
      `${label} failed: ${failed.map((entry) => `${entry.name}: ${entry.detail}`).join('; ')}`,
    )
  }
}

const countSourceLines = (source: string): number =>
  source.split('\n').filter((line) => {
    const trimmed = line.trim()
    return (
      trimmed.length > 0 &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('*') &&
      trimmed !== '/*' &&
      trimmed !== '*/'
    )
  }).length

const runVitest = async (cwd: string, label: string) => {
  const result = await command('pnpm', ['exec', 'vitest', 'run'], {
    cwd,
    timeout: 180_000,
  })
  await writeJson(ARTIFACTS, `${label}-vitest.json`, {
    code: result.code,
    stdout: result.stdout.slice(-8_000),
    stderr: result.stderr.slice(-8_000),
  })
  if (result.code !== 0) {
    fail(
      `${label} vitest failed (${result.code}): ${result.stderr || result.stdout}`,
    )
  }
}

const run = async () => {
  await mkdir(ARTIFACTS, { recursive: true })

  console.log('P08 evidence-client tests and stories...')
  await runVitest(CLIENT, 'evidence-client')
  console.log('P08 settled-text tests...')
  await runVitest(UI, 'ui')

  const variantChecks: Record<string, ReadonlyArray<CaptureCheck>> = {}
  for (const driver of VARIANTS) {
    console.log(`P08 ${driver.name} contract...`)
    const checks = await Effect.runPromise(runCaptureChecks(driver))
    requirePass(checks, driver.name)
    variantChecks[driver.name] = checks
    await writeJson(ARTIFACTS, `${driver.name}.json`, checks)
  }

  console.log('P08 broken positive control...')
  const broken = await Effect.runPromise(runCaptureChecks(brokenDriver))
  await writeJson(ARTIFACTS, 'broken.json', broken)
  const confirm = broken.find((entry) => entry.name === 'confirm reaches idle')
  if (confirm?.status !== 'FAIL' || allPassed(broken)) {
    fail(
      'Positive control failed: the broken variant passed the shared capture tests',
    )
  }

  const loc: Record<string, number> = {}
  for (const [name, relative] of Object.entries(VARIANT_FILES)) {
    loc[name] = countSourceLines(await readFile(join(ROOT, relative), 'utf8'))
  }

  const comparison = {
    typeSafety: {
      xstate:
        'Typed setup() events. Impossible phases are unrepresentable in the state tree. fromPromise erases Effect errors into Promise rejection.',
      'effect-machine':
        'Schema-first states and events. invokeEffect keeps Effect errors typed. API is pre-1.0 and still moving.',
      atom:
        'Shared CaptureEvent tagged union plus a reducer. Impossible phases are possible until the reducer refuses them. Query atoms already use Atom.',
    },
    testAndStoryErgonomics: {
      xstate:
        'createActor + subscribe. Same CaptureSession seam as the others once wrapped.',
      'effect-machine':
        'Machine.start needs a live Scope. Same CaptureSession seam after wrapping.',
      atom:
        'AtomRegistry get/set/subscribe is the same seam used by query atoms. Least extra test API.',
    },
    loc,
    winner: 'atom' as const,
    winnerReason:
      'Same Atom/Reactivity model as D42 query atoms, no fromPromise seam, MIT Effect-native stack. XState and effect-machine remain retained probes.',
  }

  await writeJson(ARTIFACTS, 'comparison.json', comparison)
  await writeJson(ARTIFACTS, 'picks.json', {
    winner: comparison.winner,
    loc,
    settleMs: 500,
    fixtureHash: 'blob:p08-fixture',
    libraries: {
      xstate: '5.33.2',
      effectMachine: '0.38.0',
      atomReact: '4.0.0-rc.116',
    },
  })
  console.log(
    `P08 passed. Winner: ${comparison.winner}. LOC ${JSON.stringify(loc)}.`,
  )
}

run().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
