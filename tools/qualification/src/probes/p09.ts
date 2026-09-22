import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Effect from 'effect/Effect'
import { P09_CHECK_COUNT, runP09 } from './p09-checks.ts'
import { fail, writeJson } from './dev-client.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const ARTIFACTS = join(ROOT, '.artifacts/qualification/p09')

const run = async () => {
  await mkdir(ARTIFACTS, { recursive: true })
  const checks = await Effect.runPromise(runP09())
  if (checks.length !== P09_CHECK_COUNT) {
    fail(`P09: expected ${P09_CHECK_COUNT} checks, got ${checks.length}`)
  }
  const failed = checks.filter((check) => check.status !== 'PASS')
  await writeJson(ARTIFACTS, 'checks.json', checks)
  if (failed.length > 0) {
    fail(
      `P09 failed: ${failed.map((check) => `${check.name}: ${check.detail}`).join('; ')}`,
    )
  }
  console.log(
    `P09 passed: datom replication over Effect RPC (${P09_CHECK_COUNT} checks).`,
  )
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
