/**
 * Every Nx project must declare tags and an evidence owner (D48', ADR 0024).
 * Unclassified projects fail verify.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const EVIDENCE_OWNERS = Object.freeze([
  'unit',
  'conformance',
  'crash-matrix',
  'storybook',
  'e2e-native',
  'e2e-web',
  'qualification',
  'type-only',
] as const)

type ProjectFile = {
  name?: string
  tags?: string[]
  metadata?: {
    evidenceOwner?: string
    rationale?: string
  }
}

const KIND_TAGS = ['kind:app', 'kind:feature', 'kind:lib', 'kind:tool'] as const

const tracked = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' },
)
  .split('\n')
  .filter((path) => path.endsWith('/project.json') || path === 'project.json')

const workspacePackages = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' },
)
  .split('\n')
  .filter(
    (path) =>
      path.endsWith('/package.json') &&
      path !== 'package.json' &&
      !path.startsWith('.agents/'),
  )

const problems: string[] = []

if (tracked.length === 0) {
  problems.push('No project.json files are tracked.')
}

const projectDirs = new Set(tracked.map((path) => dirname(path)))

for (const pkg of workspacePackages) {
  const dir = dirname(pkg)
  if (!projectDirs.has(dir)) {
    problems.push(
      `${pkg} has no sibling project.json. Every workspace package must declare tags and an evidence owner.`,
    )
  }
}

for (const path of tracked) {
  let parsed: ProjectFile
  try {
    parsed = JSON.parse(readFileSync(join(process.cwd(), path), 'utf8')) as ProjectFile
  } catch (error) {
    problems.push(`${path} is not valid JSON: ${String(error)}`)
    continue
  }

  const tags = parsed.tags ?? []
  if (tags.length === 0) {
    problems.push(`${path} has no tags.`)
  } else if (!tags.some((tag) => (KIND_TAGS as readonly string[]).includes(tag))) {
    problems.push(
      `${path} has no kind: tag (need one of ${KIND_TAGS.join(', ')}).`,
    )
  }

  const owner = parsed.metadata?.evidenceOwner
  if (!owner) {
    problems.push(`${path} is missing metadata.evidenceOwner.`)
  } else if (!(EVIDENCE_OWNERS as readonly string[]).includes(owner)) {
    problems.push(
      `${path} has unknown evidenceOwner "${owner}". Allowed: ${EVIDENCE_OWNERS.join(', ')}.`,
    )
  }

  const rationale = parsed.metadata?.rationale?.trim()
  if (!rationale) {
    problems.push(`${path} is missing metadata.rationale.`)
  }
}

if (problems.length > 0) {
  throw new Error(
    `Ownership registry is incomplete:\n${problems.map((line) => `  ${line}`).join('\n')}`,
  )
}

console.log(
  `Ownership registry: ${tracked.length} projects classified, ${EVIDENCE_OWNERS.length} allowed owners.`,
)
