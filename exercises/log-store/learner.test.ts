import { execFile } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from '@effect/vitest'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const run = (args: ReadonlyArray<string>) =>
  new Promise<{ code: number; output: string }>((done) => {
    execFile('pnpm', ['exercise', ...args], { cwd: ROOT, env: { ...process.env, CI: '1' } }, (error, stdout, stderr) => {
      done({ code: error ? Number(error.code ?? 1) : 0, output: `${stdout}${stderr}` })
    })
  })

describe('pnpm exercise', () => {
  it('runs only problem/ of one exercise, and says what is missing and where to edit', async () => {
    const { code, output } = await run(['log-store', '02.01'])
    expect(code).not.toBe(0)
    expect(output).toContain('02.01 mint: not yet')
    expect(output).toContain('same millisecond: (pt, c) not above the last')
    expect(output).toContain('Edit   exercises/log-store/02.01-mint/problem/mint.ts')
    expect(output).toContain('Reread lesson 02, Time without a trusted clock')
    expect(output).not.toContain('02.02')
  }, 60_000)
})
