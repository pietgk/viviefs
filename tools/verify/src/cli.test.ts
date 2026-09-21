import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from '@effect/vitest'
import { formatHelp } from './stages.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const VERIFY = 'tools/verify/src/verify.ts'

const NODE_COLOR_WARNING =
  /^\(node:\d+\) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set\.\n(?:\(Use `node --trace-warnings \.\.\.` to show where the warning was created\)\n)?/

const runVerify = (
  args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> =>
  new Promise((settle, reject) => {
    const child = spawn(
      process.execPath,
      ['--experimental-strip-types', VERIFY, ...args],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
    )
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => {
      settle({
        code: code ?? 1,
        stdout,
        stderr: stderr.replace(NODE_COLOR_WARNING, ''),
      })
    })
  })

it('prints the stage table for help and exits 0', async () => {
  const result = await runVerify(['help'])
  expect(result.code).toBe(0)
  expect(result.stdout).toBe(formatHelp())
  expect(result.stderr).toBe('')
})

it('rejects an unknown stage or step with exit 2', async () => {
  const result = await runVerify(['not-a-stage'])
  expect(result.code).toBe(2)
  expect(result.stderr).toContain('Unknown stage or step: not-a-stage')
  expect(result.stderr).toContain('pnpm verify help')
})
