import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { expect, it } from '@effect/vitest'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

const lint = async (filePath: string, code: string) => {
  const eslint = new ESLint({ cwd: ROOT })
  const [result] = await eslint.lintText(code, {
    filePath: resolve(ROOT, filePath),
  })
  return result?.messages.map((message) => message.message) ?? []
}

const d26 = (messages: readonly string[]) =>
  messages.filter((message) => message.startsWith('D26:'))

it('forbids Date.now and Math.random in tests, and still allows async', async () => {
  const unitNow = d26(
    await lint('libs/datom/src/clock.test.ts', 'export const n = Date.now()\n'),
  )
  const unitRandom = d26(
    await lint(
      'libs/datom/src/clock.test.ts',
      'export const n = Math.random()\n',
    ),
  )
  const toolNow = d26(
    await lint(
      'tools/verify/src/example.test.ts',
      'export const n = Date.now()\n',
    ),
  )
  const integrationNow = d26(
    await lint(
      'libs/store-sqlite-node/src/log-store.integration.test.ts',
      'export const n = Date.now()\n',
    ),
  )
  const asyncOk = d26(
    await lint(
      'libs/datom/src/clock.test.ts',
      'export const go = async () => 1\n',
    ),
  )

  expect(unitNow.some((message) => message.includes('Date.now'))).toBe(true)
  expect(unitRandom.some((message) => message.includes('Math.random'))).toBe(
    true,
  )
  expect(toolNow.some((message) => message.includes('Date.now'))).toBe(true)
  expect(integrationNow.some((message) => message.includes('Date.now'))).toBe(
    true,
  )
  expect(asyncOk).toEqual([])
})
