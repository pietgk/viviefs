import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from '@effect/vitest'
import { implementedGates } from './gates.ts'
import { command } from './process.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

const runCli = (args: string[]) =>
  command(
    process.execPath,
    ['--experimental-strip-types', 'tools/qualification/src/cli.ts', ...args],
    { cwd: ROOT },
  )

it('prints usage and exits 1 when the action is missing', async () => {
  const result = await runCli([])
  expect(result.code).toBe(1)
  expect(result.stderr).toContain('Usage: pnpm qualify')
  expect(result.stderr).toContain('--gate')
  expect(result.stderr).toContain('--foundation')
  expect(result.stderr).toContain(implementedGates.join(', '))
})

it('prints usage and exits 1 for an unknown action', async () => {
  const result = await runCli(['not-an-action'])
  expect(result.code).toBe(1)
  expect(result.stderr).toContain('Usage: pnpm qualify')
})

it('rejects an unknown qualify flag with exit 1', async () => {
  const result = await runCli(['qualify', '--unknown-flag'])
  expect(result.code).toBe(1)
  expect(`${result.stdout}\n${result.stderr}`).toContain('--unknown-flag')
})

it('rejects --gate without a value with exit 1', async () => {
  const result = await runCli(['qualify', '--gate'])
  expect(result.code).toBe(1)
  expect(`${result.stdout}\n${result.stderr}`).toContain('--gate')
})

it('accepts --foundation as a qualify flag before refusing an unimplemented gate', async () => {
  const result = await runCli(['qualify', '--foundation', '--gate', 'P99'])
  expect(result.code).toBe(1)
  expect(result.stderr).toContain('not implemented')
  expect(result.stderr).not.toContain('Unknown or incomplete argument')
})

it('prints cumulative ledger state', async () => {
  const result = await runCli(['ledger'])
  expect(result.code).toBe(0)
  expect(result.stdout).toContain('Cumulative state only')
  for (const gate of implementedGates) {
    expect(result.stdout).toContain(gate)
  }
})
