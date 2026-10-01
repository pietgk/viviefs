import { mkdtemp, mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from '@effect/vitest'
import { beginGate, ledgerState, recordGate } from './ledger.ts'
import { checked } from './process.ts'

it('invalidates imported, dependency, added and in-flight inputs while preserving ledger history', async () => {
  const root = await mkdtemp(join(tmpdir(), 'viviefs-ledger-'))
  const at = (path: string) => join(root, path)
  const probe = 'tools/qualification/probe.ts'
  const helper = 'tools/qualification/helper.ts'
  const record = async (
    status: 'pass' | 'fail' = 'pass',
    started?: Awaited<ReturnType<typeof beginGate>>,
  ) =>
    recordGate(
      {
        gate: 'P02',
        status,
        started: started ?? (await beginGate(probe, root)),
        probe,
        artifacts: 'fixture',
        exitCode: status === 'pass' ? 0 : 7,
      },
      root,
    )
  const state = async () => (await ledgerState(['P02'], root))[0]?.status
  try {
    await checked('git', ['init', '--quiet'], { cwd: root })
    await mkdir(at('tools/qualification'), { recursive: true })
    await writeFile(at(probe), "import './helper.ts'\n")
    await writeFile(at(helper), 'export const value = 1\n')
    await writeFile(at('pnpm-lock.yaml'), "lockfileVersion: '9.0'\n")

    await record()
    expect(await state()).toBe('pass')

    await writeFile(at(helper), 'export const value = 2')
    expect(await state()).toBe('stale')
    await record()

    await writeFile(at('pnpm-lock.yaml'), 'changed dependency')
    expect(await state()).toBe('stale')
    await record()

    await writeFile(at('tools/qualification/new.ts'), 'new input')
    expect(await state()).toBe('stale')
    await record()

    await unlink(at('tools/qualification/new.ts'))
    expect(await state()).toBe('stale')

    const started = await beginGate(probe, root)
    await writeFile(at(helper), 'changed while the probe was running')
    expect((await record('pass', started)).status).toBe('fail')
    expect(await state()).toBe('stale')

    await record('fail')
    expect(await state()).toBe('fail')

    const path = at('tools/qualification/gate-ledger.json')
    const ledger = JSON.parse(await readFile(path, 'utf8')) as {
      entries: Array<Record<string, unknown>>
    }
    expect(ledger.entries).toHaveLength(6)
    ledger.entries.push({ ...ledger.entries[0], inputsSha256: undefined })
    await writeFile(path, JSON.stringify(ledger))
    expect(await state()).toBe('stale')
    expect((await ledgerState(['P14'], root))[0]?.status).toBe('not run')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
