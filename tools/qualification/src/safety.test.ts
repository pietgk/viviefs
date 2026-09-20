import { describe, expect, it } from '@effect/vitest'
import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { command } from './process.ts'
import { foundationGates, gateProbes, implementedGates } from './gates.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('qualification harness safety', () => {
  it('never presents an unimplemented gate as a passing check', async () => {
    for (const unimplemented of ['P00', 'P15', 'Q01', 'P99']) {
      const result = await command(
        process.execPath,
        [
          '--experimental-strip-types',
          'tools/qualification/src/cli.ts',
          'qualify',
          '--gate',
          unimplemented,
        ],
        { cwd: ROOT },
      )
      expect(result.code).toBe(1)
      expect(result.stderr).toContain('not implemented')
    }
  })

  it('backs every gate in the table with a probe that exists', async () => {
    expect(implementedGates).toEqual(
      Array.from({ length: 14 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`),
    )
    expect(foundationGates).toEqual(
      Array.from({ length: 10 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`),
    )
    for (const probe of gateProbes) {
      await expect(
        stat(resolve(ROOT, probe.path)),
        `${probe.gate} names a probe that does not exist: ${probe.path}`,
      ).resolves.toBeTruthy()
      expect(probe.summary.length).toBeGreaterThan(20)
    }
  })

  it('preserves a failed child exit and diagnostics', async () => {
    const result = await command(process.execPath, [
      '-e',
      'console.error("intentional diagnostic");process.exit(7)',
    ])
    expect(result.code).toBe(7)
    expect(result.stderr).toContain('intentional diagnostic')
  })

  it('bounds a hung child without reporting success', async () => {
    const result = await command(
      process.execPath,
      ['-e', 'setInterval(()=>{},1000)'],
      { timeout: 100 },
    )
    expect(result.code).toBe(124)
    expect(result.stderr).toContain('timed out')
  })
})
