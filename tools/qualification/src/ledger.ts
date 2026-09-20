import { createHash } from 'node:crypto'
import { readFile, writeFile, rename } from 'node:fs/promises'
import { checked, command } from './process.ts'

const ledgerPath = 'tools/qualification/gate-ledger.json'

export interface LedgerEntry {
  gate: string
  status: 'pass' | 'fail'
  recordedAt: string
  commit: string
  dirty: boolean
  artifacts: string
  exitCode: number
  probe: string
  probeSha256: string
  inputsSha256?: string
  inputsChangedDuringRun?: boolean
}

interface Ledger {
  note: string
  entries: LedgerEntry[]
}

const emptyLedger: Ledger = {
  note: 'Written by tools/qualification/src/ledger.ts. Do not edit by hand. An entry records one gate run; a gate counts as cumulatively passed only while its complete qualification input fingerprint matches and inputs remained unchanged during the run. Foundation closure additionally requires one sequential full run of P01-P10.',
  entries: [],
}

async function readLedger(): Promise<Ledger> {
  try {
    return JSON.parse(await readFile(ledgerPath, 'utf8')) as Ledger
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    return emptyLedger
  }
}

async function hashFile(path: string): Promise<string> {
  try {
    return createHash('sha256')
      .update(await readFile(path))
      .digest('hex')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    return 'absent'
  }
}

async function revision() {
  const head = await command('git', ['rev-parse', 'HEAD'], { timeout: 15_000 })
  const status = await command('git', ['status', '--porcelain'], {
    timeout: 30_000,
  })
  const changed = status.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).replace(/^"|"$/g, ''))
    .filter((path) => path !== ledgerPath)
  return {
    commit: head.code === 0 ? head.stdout.trim() : 'unknown',
    dirty: status.code !== 0 || changed.length > 0,
  }
}

export async function inputsFingerprint(): Promise<string> {
  const files = await checked('git', [
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '-z',
    '--',
    'tools/qualification',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'nx.json',
    'tsconfig.json',
    'tsconfig.base.json',
    'eslint.config.js',
    '.npmrc',
  ])
  const paths = [...new Set(files.split('\0').filter(Boolean))]
    .filter(
      (path) =>
        path !== ledgerPath &&
        path !== `${ledgerPath}.tmp` &&
        !path.endsWith('.md'),
    )
    .sort()
  if (!paths.length)
    throw new Error('No qualification inputs found in the repository')
  const hash = createHash('sha256')
  for (const path of paths)
    hash.update(JSON.stringify([path, await hashFile(path)]) + '\n')
  return hash.digest('hex')
}

export async function beginGate(probe: string) {
  return {
    ...(await revision()),
    probeSha256: await hashFile(probe),
    inputsSha256: await inputsFingerprint(),
  }
}

export async function recordGate(entry: {
  gate: string
  status: 'pass' | 'fail'
  artifacts: string
  exitCode: number
  probe: string
  started: Awaited<ReturnType<typeof beginGate>>
}): Promise<LedgerEntry> {
  const ledger = await readLedger()
  const finished = await revision()
  const inputsChangedDuringRun =
    entry.started.inputsSha256 !== (await inputsFingerprint()) ||
    entry.started.commit !== finished.commit
  const recorded: LedgerEntry = {
    gate: entry.gate,
    status: inputsChangedDuringRun ? 'fail' : entry.status,
    recordedAt: new Date().toISOString(),
    commit: entry.started.commit,
    dirty: entry.started.dirty || finished.dirty,
    artifacts: entry.artifacts,
    exitCode: entry.exitCode,
    probe: entry.probe,
    probeSha256: entry.started.probeSha256,
    inputsSha256: entry.started.inputsSha256,
    inputsChangedDuringRun,
  }
  ledger.note = emptyLedger.note
  ledger.entries.push(recorded)
  await writeFile(
    `${ledgerPath}.tmp`,
    JSON.stringify(ledger, null, 2) + '\n',
    'utf8',
  )
  await rename(`${ledgerPath}.tmp`, ledgerPath)
  return recorded
}

export interface GateState {
  gate: string
  status: 'pass' | 'fail' | 'not run' | 'stale'
  detail: string
}

export async function ledgerState(gates: string[]): Promise<GateState[]> {
  const ledger = await readLedger()
  const state: GateState[] = []
  const current = await inputsFingerprint()
  for (const gate of gates) {
    const last = [...ledger.entries]
      .reverse()
      .find((entry) => entry.gate === gate)
    if (!last) {
      state.push({ gate, status: 'not run', detail: 'no ledger entry' })
      continue
    }
    if (last.inputsChangedDuringRun) {
      state.push({
        gate,
        status: 'stale',
        detail:
          'qualification inputs or revision changed during the run; rerun required',
      })
      continue
    }
    if (last.status !== 'pass') {
      state.push({
        gate,
        status: 'fail',
        detail: `last run ${last.recordedAt} exited ${last.exitCode}`,
      })
      continue
    }
    state.push(
      current === last.inputsSha256
        ? {
            gate,
            status: 'pass',
            detail: `${last.recordedAt} ${last.commit.slice(0, 8)}${last.dirty ? ' (dirty tree)' : ''}`,
          }
        : {
            gate,
            status: 'stale',
            detail: last.inputsSha256
              ? 'qualification inputs changed since the recorded pass; rerun required'
              : 'legacy entry fingerprints only the entry script; rerun required',
          },
    )
  }
  return state
}
