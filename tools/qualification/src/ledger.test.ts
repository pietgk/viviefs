import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from '@effect/vitest'
import { checked } from './process.ts'

it('invalidates imported, dependency, added and in-flight inputs while preserving ledger history', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'viviefs-ledger-'))
  const module = fileURLToPath(new URL('./ledger.ts', import.meta.url))
  try {
    await checked('git', ['init', '--quiet'], { cwd: directory })
    await mkdir(join(directory, 'tools/qualification'), { recursive: true })
    await writeFile(
      join(directory, 'tools/qualification/probe.ts'),
      "import './helper.ts'\n",
    )
    await writeFile(
      join(directory, 'tools/qualification/helper.ts'),
      'export const value = 1\n',
    )
    await writeFile(
      join(directory, 'pnpm-lock.yaml'),
      "lockfileVersion: '9.0'\n",
    )
    const output = await checked(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '-e',
        `
      import assert from 'node:assert/strict'
      import { writeFile, readFile, unlink } from 'node:fs/promises'
      import { beginGate, recordGate, ledgerState } from ${JSON.stringify(module)}
      const probe = 'tools/qualification/probe.ts'
      const helper = 'tools/qualification/helper.ts'
      const record = async (status = 'pass', started) =>
        recordGate({ gate: 'P02', status, started: started ?? await beginGate(probe), probe, artifacts: 'fixture', exitCode: status === 'pass' ? 0 : 7 })
      const state = async () => (await ledgerState(['P02']))[0].status
      await record()
      assert.equal(await state(), 'pass')
      await writeFile(helper, 'export const value = 2')
      assert.equal(await state(), 'stale')
      await record()
      await writeFile('pnpm-lock.yaml', 'changed dependency')
      assert.equal(await state(), 'stale')
      await record()
      await writeFile('tools/qualification/new.ts', 'new input')
      assert.equal(await state(), 'stale')
      await record()
      await unlink('tools/qualification/new.ts')
      assert.equal(await state(), 'stale')
      const started = await beginGate(probe)
      await writeFile(helper, 'changed while the probe was running')
      assert.equal((await record('pass', started)).status, 'fail')
      assert.equal(await state(), 'stale')
      await record('fail')
      assert.equal(await state(), 'fail')
      const path = 'tools/qualification/gate-ledger.json'
      const ledger = JSON.parse(await readFile(path, 'utf8'))
      assert.equal(ledger.entries.length, 6)
      ledger.entries.push({ ...ledger.entries[0], inputsSha256: undefined })
      await writeFile(path, JSON.stringify(ledger))
      assert.equal(await state(), 'stale')
      assert.equal((await ledgerState(['P14']))[0].status, 'not run')
      console.log('Ledger regression scenarios passed')
    `,
      ],
      { cwd: directory },
    )
    expect(output).toContain('Ledger regression scenarios passed')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
