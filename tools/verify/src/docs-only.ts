/**
 * The docs-only path rule (05-verify-qualify-teach, D61).
 *
 * "Done" is a green `verify`. A change that touches only prose cannot break
 * code, so its done is a green run of the steps that check prose. Which
 * change is docs-only is decided here, by path, never by judgment.
 *
 * `pnpm verify` without a selector applies the rule to the change since the
 * upstream branch, including uncommitted and untracked files. CI always runs
 * every stage.
 */
import { execFileSync } from 'node:child_process'

/** Paths whose change alone cannot break code, each with its reason. */
export const DOCS_ONLY_PATHS: ReadonlyArray<{
  readonly label: string
  readonly pattern: RegExp
  readonly reason: string
}> = [
  {
    label: '*.md',
    pattern: /^[^/]+\.md$/,
    reason: 'repository-root Markdown: the agent map, the glossary, the readme',
  },
  {
    label: 'docs/** except docs/evidence/**',
    pattern: /^docs\/(?!evidence\/)/,
    reason:
      'ADRs, plans, research records and agent docs. Evidence notes are not ' +
      'docs-only: the P03 and P09-P11 probe tests read them',
  },
  {
    label: 'apps/docs/src/content/**/*.md(x)',
    pattern: /^apps\/docs\/src\/content\/.+\.mdx?$/,
    reason: 'docs site pages; the site build checks what they embed',
  },
]

/** The steps that check a docs-only change. */
export const DOCS_ONLY_STEPS: ReadonlyArray<string> = ['docs', 'diagrams']

export const isDocsOnlyPath = (path: string): boolean =>
  DOCS_ONLY_PATHS.some(({ pattern }) => pattern.test(path))

/** A change is docs-only when it touches at least one path and only docs-only paths. */
export const isDocsOnly = (paths: ReadonlyArray<string>): boolean =>
  paths.length > 0 && paths.every(isDocsOnlyPath)

const git = (cwd: string, args: ReadonlyArray<string>): string | null => {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

/**
 * Every path the change touches: commits since the upstream branch (or
 * `origin/main`), staged and unstaged edits, and untracked files. A rename
 * counts as both of its paths.
 */
export const changedPaths = (cwd: string): ReadonlyArray<string> => {
  const base =
    git(cwd, ['merge-base', 'HEAD', '@{upstream}']) ??
    git(cwd, ['merge-base', 'HEAD', 'origin/main']) ??
    'HEAD'
  const lines = [
    git(cwd, ['diff', '--name-only', '--no-renames', base]) ?? '',
    git(cwd, ['ls-files', '--others', '--exclude-standard']) ?? '',
  ].join('\n')
  return [...new Set(lines.split('\n').filter((path) => path !== ''))].sort()
}
