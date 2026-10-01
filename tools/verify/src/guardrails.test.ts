// Checks that can fail for the ADRs whose qualifying gate is verify
// (ADR-0024, 0025, 0028, 0029, 0031). Each rule is shown firing on a real
// violation, next to a legal case that passes. ADR-0030's characterization
// tests are cli.test.ts here and in tools/qualification.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from '@effect/vitest'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

const lint = async (filePath: string, code: string) => {
  const eslint = new ESLint({ cwd: ROOT })
  const [result] = await eslint.lintText(code, {
    filePath: resolve(ROOT, filePath),
  })
  return result?.messages ?? []
}

const ruleMessages = async (rule: string, filePath: string, code: string) =>
  (await lint(filePath, code))
    .filter((message) => message.ruleId === rule)
    .map((message) => message.message)

describe('ADR-0024: module boundaries', () => {
  const boundary = (filePath: string, code: string) =>
    ruleMessages('@nx/enforce-module-boundaries', filePath, code)

  it('refuses a lib that imports an app', async () => {
    expect(
      await boundary('libs/datom/src/guardrail.ts', "import '@viviefs/evidence-server'\n"),
    ).not.toEqual([])
  })

  it('refuses a client feature that imports an adapter', async () => {
    expect(
      await boundary(
        'features/evidence/client/src/guardrail.ts',
        "import '@viviefs/store-sqlite-native'\n",
      ),
    ).not.toEqual([])
  })

  it('refuses universal core code that imports a server adapter', async () => {
    expect(
      await boundary('libs/datom/src/guardrail.ts', "import '@viviefs/store-sqlite-node'\n"),
    ).not.toEqual([])
  })

  it('refuses core code that imports the testing lib', async () => {
    expect(
      await boundary('libs/identity/src/guardrail.ts', "import '@viviefs/testing'\n"),
    ).not.toEqual([])
  })

  it('lets a suite import the testing lib (D80)', async () => {
    expect(
      await boundary('libs/datom/src/suites/guardrail.ts', "import '@viviefs/testing'\n"),
    ).toEqual([])
  })

  it('allows core code to import core code', async () => {
    expect(
      await boundary('libs/sync/protocol/src/guardrail.ts', "import '@viviefs/datom'\n"),
    ).toEqual([])
  })
})

// A throwaway git repository, so the verify checks read a tree with a real defect.
const inScratchRepo = (files: Record<string, string>, run: (dir: string) => void) => {
  const dir = mkdtempSync(join(tmpdir(), 'viviefs-guardrail-'))
  try {
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true })
      writeFileSync(join(dir, path), content)
    }
    execFileSync('git', ['init', '-q'], { cwd: dir })
    run(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const runCheck = (script: string, cwd: string) => {
  try {
    const stdout = execFileSync(
      process.execPath,
      ['--experimental-strip-types', resolve(ROOT, 'tools/verify/src', script)],
      { cwd, encoding: 'utf8', stdio: 'pipe' },
    )
    return { ok: true, output: stdout }
  } catch (error) {
    const failed = error as { stdout?: string; stderr?: string }
    return { ok: false, output: `${failed.stdout ?? ''}${failed.stderr ?? ''}` }
  }
}

describe('ADR-0024: lint scope', () => {
  const config = "export default [{ files: ['**/*.ts'] }, { ignores: ['hidden/**'] }]\n"

  it('fails a source file that no lint configuration covers', () => {
    inScratchRepo(
      { 'eslint.config.js': config, 'src/seen.ts': '', 'hidden/unseen.ts': '' },
      (dir) => {
        const result = runCheck('check-lint-scope.ts', dir)
        expect(result.ok).toBe(false)
        expect(result.output).toContain('hidden/unseen.ts')
      },
    )
  })

  it('passes when every source file is linted', () => {
    inScratchRepo({ 'eslint.config.js': config, 'src/seen.ts': '' }, (dir) => {
      expect(runCheck('check-lint-scope.ts', dir).ok).toBe(true)
    })
  })
})

describe('ADR-0025: determinism and asynchrony in domain and workflow code', () => {
  const d26 = async (code: string) =>
    (await lint('libs/workflow-engine/src/guardrail.ts', code))
      .map((message) => message.message)
      .filter((message) => message.includes('D26:'))

  it.each([
    ['async function', 'export async function go() { return 1 }\n', 'raw async'],
    ['async arrow', 'export const go = async () => 1\n', 'raw async'],
    ['try', 'export const go = () => { try { return 1 } catch { return 2 } }\n', 'raw try'],
    ['Promise', 'export const go = () => Promise.resolve(1)\n', 'raw Promise'],
    ['Date.now', 'export const now = () => Date.now()\n', 'Date.now'],
    ['Math.random', 'export const pick = () => Math.random()\n', 'Math.random'],
    ['DateTime.nowUnsafe', "import * as DateTime from 'effect/DateTime'\nexport const now = () => DateTime.nowUnsafe()\n", 'reading the clock'],
    ['performance.now', 'export const now = () => performance.now()\n', 'reading the clock'],
    ['crypto.randomUUID', 'export const id = () => crypto.randomUUID()\n', 'id generation'],
    ['getRandomValues', 'export const fill = (bytes: Uint8Array) => globalThis.crypto.getRandomValues(bytes)\n', 'id generation'],
  ])('refuses %s', async (_name, code, expected) => {
    expect((await d26(code)).some((message) => message.includes(expected))).toBe(true)
  })

  it('allows the same work written with Effect', async () => {
    expect(
      await d26(
        "import { Clock, Effect, Random } from 'effect'\n" +
          'export const go = Effect.gen(function* () {\n' +
          '  const now = yield* Clock.currentTimeMillis\n' +
          '  const pick = yield* Random.next\n' +
          '  return now + pick\n' +
          '})\n',
      ),
    ).toEqual([])
  })
})

describe('ADR-0029: repos/ is reference only', () => {
  it('refuses an import from repos/', async () => {
    expect(
      await ruleMessages(
        'no-restricted-imports',
        'libs/datom/src/guardrail.ts',
        "import '../../../repos/effect/packages/effect/src/index.ts'\n",
      ),
    ).not.toEqual([])
  })
})

describe('ADR-0028 and ADR-0029: TypeScript toolchain', () => {
  const version = (bin: string) =>
    execFileSync('pnpm', ['exec', bin, '--version'], { cwd: ROOT, encoding: 'utf8' }).trim()

  it('runs tsc on TypeScript 7 patched by @effect/tsgo', () => {
    expect(version('tsc')).toMatch(/^Version 7\.\d+\.\d+\+effect-tsgo\./)
  })

  it('keeps the TypeScript 6 API under the typescript name', async () => {
    expect(version('tsc6')).toMatch(/^Version 6\./)
    const typescript = (await import('typescript')).default
    expect(typescript.version).toMatch(/^6\./)
    expect(typeof typescript.readConfigFile).toBe('function')
  })
})

describe('ADR-0031: TypeScript strictness flags', () => {
  const options = (
    JSON.parse(readFileSync(resolve(ROOT, 'tsconfig.base.json'), 'utf8')) as {
      compilerOptions: Record<string, unknown>
    }
  ).compilerOptions

  it('keeps the three flags on', () => {
    expect(options['verbatimModuleSyntax']).toBe(true)
    expect(options['exactOptionalPropertyTypes']).toBe(true)
    expect(options['moduleDetection']).toBe('force')
  })

  it('keeps the rewrite and deprecation-ignore flags off', () => {
    expect(options).not.toHaveProperty('rewriteRelativeImportExtensions')
    expect(options).not.toHaveProperty('ignoreDeprecations')
  })
})

describe('D80: test-support stays out of production code', () => {
  const testSupport = async (filePath: string, code: string) =>
    (await ruleMessages('no-restricted-imports', filePath, code)).filter((message) =>
      message.includes('D80:'),
    )

  it('refuses a suites entry or the testing lib in production code', async () => {
    expect(
      await testSupport('features/evidence/client/src/guardrail.ts', "import '@viviefs/identity/suites'\n"),
    ).not.toEqual([])
    expect(
      await testSupport('libs/sync/client/src/guardrail.ts', "import '@viviefs/datom/suites'\n"),
    ).not.toEqual([])
    expect(
      await testSupport('libs/datom/src/guardrail.ts', "import '@viviefs/testing/node'\n"),
    ).not.toEqual([])
  })

  it('allows them in tests, suites and the evidence apps', async () => {
    expect(
      await testSupport('libs/store-sqlite-node/src/guardrail.integration.test.ts', "import '@viviefs/datom/suites'\n"),
    ).toEqual([])
    expect(
      await testSupport('libs/telemetry/src/suites/guardrail.ts', "import '@viviefs/workflow-engine/suites'\n"),
    ).toEqual([])
    expect(
      await testSupport('apps/evidence-mobile/src/guardrail.ts', "import '@viviefs/datom/suites'\n"),
    ).toEqual([])
  })
})

describe('D79: Schema at every boundary', () => {
  const d79 = async (filePath: string, code: string) =>
    (await lint(filePath, code)).map((message) => message.message).filter((message) => message.includes('D79:'))

  it.each([
    ['a sql<T> row type', 'const rows = sql<{ seq: number }>`SELECT seq FROM datoms`\n'],
    ['JSON.parse', 'export const value = JSON.parse(text)\n'],
    ['a response body read with .json()', 'export const body = response.json()\n'],
    ['a double cast', 'export const port = self as unknown as MessagePort\n'],
  ])('refuses %s in production code', async (_name, code) => {
    expect(await d79('libs/sync/server/src/guardrail.ts', code)).not.toEqual([])
  })

  it('passes rows decoded by a Schema, a single cast, and the same code in tests', async () => {
    expect(
      await d79(
        'libs/sync/server/src/guardrail.ts',
        'const rows = sql`SELECT seq FROM datoms`.pipe(rowsOf(SeqRow))\nexport const x = value as Thing\n',
      ),
    ).toEqual([])
    expect(await d79('libs/sync/server/src/guardrail.test.ts', 'export const value = JSON.parse(text)\n')).toEqual([])
  })
})
