/**
 * The vendored skill tree stays what `skills-lock.json` pins (ADR-0027):
 * byte-identical to an upstream commit, visible to Claude Code through
 * `.claude/skills/`, and invoked the same way in Claude Code, Cursor and Codex.
 */
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync } from 'node:fs'
import { join, relative } from 'node:path'

/** Skills this repo owns instead of vendoring, each with the reason it forked. */
export const REPO_OWNED_SKILLS: Readonly<Record<string, string>> = Object.freeze({
  'scaffold-exercises': 'fork of mattpocock/skills adapted to the exercise layout of D66',
})

type LockEntry = { ref?: string; computedHash?: string }

const COMMIT = /^[0-9a-f]{40}$/

const collectFiles = (base: string, dir: string, files: Array<{ path: string; content: Buffer }>) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== '.git' && entry.name !== 'node_modules') collectFiles(base, full, files)
    } else if (entry.isFile()) {
      files.push({ path: relative(base, full).split('\\').join('/'), content: readFileSync(full) })
    }
  }
}

/** The whole-folder hash the `skills` CLI writes as `computedHash` (skills@1.7.0). */
export const skillFolderHash = (dir: string): string => {
  const files: Array<{ path: string; content: Buffer }> = []
  collectFiles(dir, dir, files)
  files.sort((a, b) => a.path.localeCompare(b.path))
  const hash = createHash('sha256')
  for (const file of files) {
    hash.update(file.path)
    hash.update(file.content)
  }
  return hash.digest('hex')
}

const frontmatter = (skillMd: string): string => /^---\n([\s\S]*?)\n---/.exec(skillMd)?.[1] ?? ''

const listDir = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).sort() : [])

/** Every problem with the skill tree under `root`; empty when it matches its lock. */
export const checkSkillsTree = (
  root: string,
  repoOwned: Readonly<Record<string, string>>,
): string[] => {
  const problems: string[] = []
  const lock = JSON.parse(readFileSync(join(root, 'skills-lock.json'), 'utf8')) as {
    skills?: Record<string, LockEntry>
  }
  const locked = lock.skills ?? {}
  const skillsDir = join(root, '.agents/skills')
  const folders = listDir(skillsDir).filter((name) => lstatSync(join(skillsDir, name)).isDirectory())

  for (const [name, entry] of Object.entries(locked)) {
    if (!entry.ref || !COMMIT.test(entry.ref)) {
      problems.push(`${name}: lock entry has no commit ref; re-add it at a commit (see AGENTS.md).`)
    }
    if (name in repoOwned) {
      problems.push(`${name}: repo-owned but also in skills-lock.json.`)
    }
    const dir = join(skillsDir, name)
    if (!folders.includes(name)) {
      problems.push(`${name}: locked but .agents/skills/${name} is missing.`)
    } else if (skillFolderHash(dir) !== entry.computedHash) {
      problems.push(
        `${name}: folder hash differs from skills-lock.json. Vendored skills are never edited; adapt in docs/agents/ or AGENTS.md, or re-add the skill (ADR-0027).`,
      )
    }
  }

  for (const name of folders) {
    if (!(name in locked) && !(name in repoOwned)) {
      problems.push(`${name}: not in skills-lock.json and not a repo-owned skill.`)
    }
    const link = join(root, '.claude/skills', name)
    const target = `../../.agents/skills/${name}`
    if (!isSymlink(link) || readlinkSync(link) !== target) {
      problems.push(`${name}: .claude/skills/${name} must be a symlink to ${target}.`)
    }

    const skillMdPath = join(skillsDir, name, 'SKILL.md')
    const meta = existsSync(skillMdPath) ? frontmatter(readFileSync(skillMdPath, 'utf8')) : ''
    const declared = /^name:\s*["']?([^"'\n]+?)["']?\s*$/m.exec(meta)?.[1]
    if (declared !== name) {
      problems.push(`${name}: SKILL.md names "${declared ?? ''}"; the folder and the name must match.`)
    }
    const userInvoked = /^disable-model-invocation:\s*true\s*$/m.test(meta)
    const openaiPath = join(skillsDir, name, 'agents/openai.yaml')
    const codexUserInvoked =
      existsSync(openaiPath) &&
      /^\s*allow_implicit_invocation:\s*false\s*$/m.test(readFileSync(openaiPath, 'utf8'))
    if (userInvoked && !codexUserInvoked) {
      problems.push(
        `${name}: user-invoked in Claude Code and Cursor but not in Codex; agents/openai.yaml needs policy.allow_implicit_invocation: false.`,
      )
    } else if (codexUserInvoked && !userInvoked) {
      problems.push(
        `${name}: user-invoked in Codex but not in Claude Code and Cursor; SKILL.md needs disable-model-invocation: true.`,
      )
    }
  }

  for (const name of listDir(join(root, '.claude/skills'))) {
    if (!folders.includes(name)) {
      problems.push(`${name}: .claude/skills/${name} has no skill in .agents/skills/.`)
    }
  }

  return problems
}

const isSymlink = (path: string): boolean => {
  try {
    return lstatSync(path).isSymbolicLink()
  } catch {
    return false
  }
}
