/**
 * `pnpm refs` (D86'): `fix` rewrites living documents, `check` is the verify
 * step, and `hook` is what an agent's write-time hook runs. A file outside
 * the living-document scope is left as written, so a hook can pass any path.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildCatalog, inReferenceScope, referenceProblems, rewriteDocument, type Catalog } from '@viviefs/references'
import { agentHookProblems, hookPaths, isHookAgent, parseHookEvent } from './hook.ts'

const rootOf = (start: string): string => {
  let directory = resolve(start)
  for (;;) {
    if (existsSync(join(directory, 'pnpm-workspace.yaml'))) return directory
    const parent = dirname(directory)
    if (parent === directory) throw new Error(`No pnpm-workspace.yaml above ${start}`)
    directory = parent
  }
}

const toRepoPath = (root: string, file: string): string | undefined => {
  const repoPath = relative(root, resolve(root, file)).split('\\').join('/')
  if (repoPath.startsWith('..') || repoPath === '') return undefined
  return repoPath
}

const read = (root: string, path: string): string | undefined => {
  const absolute = join(root, path)
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : undefined
}

const livingFiles = (root: string): ReadonlyArray<string> =>
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((path) => path !== '' && inReferenceScope(path))

const fixOne = (root: string, catalog: Catalog, file: string): ReadonlyArray<string> => {
  const path = toRepoPath(root, file)
  if (path === undefined || !inReferenceScope(path)) return []
  const source = read(root, path)
  if (source === undefined) return []
  const result = rewriteDocument(source, path, catalog)
  if (result.text !== source) {
    writeFileSync(join(root, path), result.text)
    console.log(`refs: named references in ${path}`)
  }
  return result.problems
}

const fixFiles = (root: string, files: ReadonlyArray<string>): number => {
  const catalog = buildCatalog(root)
  const problems = files.flatMap((file) => fixOne(root, catalog, file))
  for (const problem of problems) console.error(problem)
  return problems.length === 0 ? 0 : 1
}

const check = (root: string): void => {
  const catalog = buildCatalog(root)
  const files = livingFiles(root)
  const problems = [
    ...files.flatMap((path) => {
      const source = read(root, path)
      return source === undefined ? [] : [...referenceProblems(source, path, catalog)]
    }),
    ...agentHookProblems((path) => read(root, path)),
  ]
  if (problems.length > 0) {
    throw new Error(`${problems.length} reference problem(s):\n${problems.map((line) => `  ${line}`).join('\n')}`)
  }
  console.log(`References: ${files.length} living documents name every gate, ADR, decision and issue.`)
}

const hook = (root: string, agent: string): number => {
  if (!isHookAgent(agent)) return usage()
  const event = parseHookEvent(readFileSync(0, 'utf8'))
  if (event === undefined) return 0
  const paths = hookPaths(agent, event)
  if (paths.length === 0) return 0
  return fixFiles(root, paths)
}

const usage = (): number => {
  console.error('usage: pnpm refs fix [files] | pnpm refs check | pnpm refs hook claude|codex|cursor')
  return 1
}

const main = (): void => {
  const root = rootOf(process.cwd())
  const [command, ...args] = process.argv.slice(2)
  if (command === 'check') {
    check(root)
    return
  }
  const code =
    command === 'fix'
      ? fixFiles(root, args.length === 0 ? livingFiles(root) : args)
      : command === 'hook'
        ? hook(root, args[0] ?? '')
        : usage()
  process.exit(code)
}

const entry = process.argv[1]
if (entry !== undefined && import.meta.url === pathToFileURL(resolve(entry)).href) main()
