// The docs-only path rule is a path rule, not judgment (05-verify-qualify-teach):
// prose alone is docs-only; any other path, or no change at all, runs everything.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from '@effect/vitest'
import { DOCS_ONLY_STEPS, changedPaths, isDocsOnly, isDocsOnlyPath } from './docs-only.ts'
import { ROOT, findStep } from './stages.ts'

describe('isDocsOnly', () => {
  it('accepts prose alone', () => {
    expect(
      isDocsOnly([
        'NOTES.md',
        'docs/adr/0000-example.md',
        'docs/research/2026-01-01-example.html',
        'apps/docs/src/content/docs/example.mdx',
      ]),
    ).toBe(true)
  })

  it('rejects a change that touches code, config or a sample', () => {
    expect(isDocsOnly(['docs/adr/0000-example.md', 'libs/example/src/index.ts'])).toBe(false)
    expect(isDocsOnly(['apps/docs/astro.config.ts'])).toBe(false)
    expect(isDocsOnly(['apps/docs/src/samples/append.ts'])).toBe(false)
    expect(isDocsOnly(['libs/datom/README.md'])).toBe(false)
    expect(isDocsOnly(['.agents/skills/tdd/SKILL.md'])).toBe(false)
    expect(isDocsOnly(['package.json'])).toBe(false)
  })

  it('rejects evidence notes, which probe tests read', () => {
    expect(isDocsOnly(['docs/evidence/2026-01-01-p00.md'])).toBe(false)
  })

  it('rejects an empty change, so a clean tree runs everything', () => {
    expect(isDocsOnly([])).toBe(false)
  })

  it('names steps that exist in the stage table', () => {
    for (const step of DOCS_ONLY_STEPS) expect(findStep(step)).toBeDefined()
  })

  // A test that names an existing docs-only file may read it, and then a
  // docs-only change could break a test the rule skips. Tests that only need
  // a path use one that does not exist; tests that build a fixture repository
  // (`mkdtempSync`) may mirror real paths inside it.
  it('holds no file a test names, so skipping the tests is safe', () => {
    const tests = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter((path) => /\.test\.tsx?$/.test(path) && !path.startsWith('repos/'))
    const PATH_LITERAL = /['"`](?:[./]*\/)?((?:docs|apps\/docs\/src\/content)\/[\w./-]+|[\w-]+\.md)['"`]/g
    const named = tests.flatMap((test) => {
      const source = readFileSync(join(ROOT, test), 'utf8')
      if (source.includes('mkdtempSync(')) return []
      return [...source.matchAll(PATH_LITERAL)]
        .map((match) => match[1] ?? '')
        .filter((path) => existsSync(join(ROOT, path)) && isDocsOnlyPath(path))
        .map((path) => `${test} names ${path}`)
    })
    expect(named).toEqual([])
  })
})

describe('changedPaths', () => {
  const roots: string[] = []
  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
  })

  const git = (cwd: string, ...args: string[]) =>
    execFileSync('git', args, { cwd, stdio: 'ignore' })

  it('lists edited, deleted, renamed and untracked paths since the base', () => {
    const root = mkdtempSync(join(tmpdir(), 'docs-only-'))
    roots.push(root)
    git(root, 'init', '-q', '-b', 'main')
    git(root, 'config', 'user.email', 'test@example.com')
    git(root, 'config', 'user.name', 'test')
    mkdirSync(join(root, 'docs'))
    writeFileSync(join(root, 'docs/a.md'), 'a\n')
    writeFileSync(join(root, 'docs/b.md'), 'b\n')
    writeFileSync(join(root, 'code.ts'), 'export {}\n')
    git(root, 'add', '.')
    git(root, 'commit', '-q', '-m', 'base')
    expect(changedPaths(root)).toEqual([])

    writeFileSync(join(root, 'docs/a.md'), 'a, edited\n')
    git(root, 'mv', 'docs/b.md', 'docs/c.md')
    writeFileSync(join(root, 'docs/new.md'), 'new\n')
    expect(changedPaths(root)).toEqual(['docs/a.md', 'docs/b.md', 'docs/c.md', 'docs/new.md'])

    git(root, 'rm', '-q', 'code.ts')
    expect(isDocsOnly(changedPaths(root))).toBe(false)
  })
})
