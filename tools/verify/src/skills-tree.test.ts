// The vendored skill tree stays what skills-lock.json pins (ADR-0027): each
// rule is shown firing on a real violation, next to a tree that passes.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from '@effect/vitest'
import { REPO_OWNED_SKILLS, checkSkillsTree, skillFolderHash } from './skills-tree.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const SHA = 'd81f3a183412e71a5b1e84ca21bc1a35eea03a60'

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const write = (root: string, path: string, content: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), content)
}

const skillMd = (name: string, userInvoked = false) =>
  `---\nname: ${name}\ndescription: ${name} does one thing.\n${userInvoked ? 'disable-model-invocation: true\n' : ''}---\n\nBody.\n`

const openaiYaml = (userInvoked: boolean) =>
  `interface:\n  display_name: "X"\n${userInvoked ? 'policy:\n  allow_implicit_invocation: false\n' : ''}`

/** A passing tree: one vendored model-invoked skill, one vendored user-invoked skill, one repo-owned skill. */
const tree = () => {
  const root = mkdtempSync(join(tmpdir(), 'skills-tree-'))
  roots.push(root)
  const skills = { tdd: false, 'grill-me': true, fork: false }
  for (const [name, userInvoked] of Object.entries(skills)) {
    write(root, `.agents/skills/${name}/SKILL.md`, skillMd(name, userInvoked))
    write(root, `.agents/skills/${name}/agents/openai.yaml`, openaiYaml(userInvoked))
    mkdirSync(join(root, '.claude/skills'), { recursive: true })
    symlinkSync(`../../.agents/skills/${name}`, join(root, `.claude/skills/${name}`))
  }
  const lock = (names: string[]) => ({
    version: 1,
    skills: Object.fromEntries(
      names.map((name) => [
        name,
        {
          source: 'mattpocock/skills',
          ref: SHA,
          sourceType: 'github',
          skillPath: `skills/${name}/SKILL.md`,
          computedHash: skillFolderHash(join(root, `.agents/skills/${name}`)),
        },
      ]),
    ),
  })
  writeFileSync(join(root, 'skills-lock.json'), JSON.stringify(lock(['tdd', 'grill-me']), null, 2))
  return root
}

const check = (root: string) => checkSkillsTree(root, { fork: 'test fork' })

const editLock = (root: string, edit: (skills: Record<string, Record<string, unknown>>) => void) => {
  const lock = JSON.parse(readFileSync(join(root, 'skills-lock.json'), 'utf8'))
  edit(lock.skills)
  writeFileSync(join(root, 'skills-lock.json'), JSON.stringify(lock))
}

describe('skill folder hash', () => {
  it('matches the hash the skills CLI wrote into this repo lock', () => {
    const lock = JSON.parse(readFileSync(join(ROOT, 'skills-lock.json'), 'utf8'))
    expect(skillFolderHash(join(ROOT, '.agents/skills/tdd'))).toBe(lock.skills.tdd.computedHash)
  })
})

describe('the vendored skill tree', () => {
  it('passes when every folder matches its lock entry', () => {
    expect(check(tree())).toEqual([])
  })

  it('refuses a vendored skill edited by hand', () => {
    const root = tree()
    write(root, '.agents/skills/tdd/SKILL.md', `${skillMd('tdd')}One local tweak.\n`)
    expect(check(root)).toEqual([expect.stringContaining('tdd: folder hash')])
  })

  it('refuses a file added to a vendored skill', () => {
    const root = tree()
    write(root, '.agents/skills/tdd/NOTES.md', 'local notes\n')
    expect(check(root)).toEqual([expect.stringContaining('tdd: folder hash')])
  })

  it('refuses a lock entry that is not pinned to a commit', () => {
    const root = tree()
    editLock(root, (skills) => {
      delete skills.tdd?.ref
    })
    expect(check(root)).toEqual([expect.stringContaining('tdd: lock entry has no commit')])
  })

  it('refuses a locked skill whose folder is missing', () => {
    const root = tree()
    rmSync(join(root, '.agents/skills/tdd'), { recursive: true })
    rmSync(join(root, '.claude/skills/tdd'))
    expect(check(root)).toEqual([expect.stringContaining('tdd: locked but .agents/skills/tdd is missing')])
  })

  it('refuses a skill that is neither locked nor repo-owned', () => {
    const root = tree()
    write(root, '.agents/skills/stray/SKILL.md', skillMd('stray'))
    symlinkSync('../../.agents/skills/stray', join(root, '.claude/skills/stray'))
    expect(check(root)).toEqual([expect.stringContaining('stray: not in skills-lock.json')])
  })

  it('refuses a repo-owned skill that is also locked', () => {
    const root = tree()
    const computedHash = skillFolderHash(join(root, '.agents/skills/fork'))
    editLock(root, (skills) => {
      skills.fork = { ...skills.tdd, skillPath: 'skills/fork/SKILL.md', computedHash }
    })
    expect(check(root)).toEqual([expect.stringContaining('fork: repo-owned but also in skills-lock.json')])
  })

  it('refuses a skill Claude Code cannot see', () => {
    const root = tree()
    rmSync(join(root, '.claude/skills/fork'))
    expect(check(root)).toEqual([expect.stringContaining('fork: .claude/skills/fork must be a symlink')])
  })

  it('refuses a .claude/skills entry with no skill behind it', () => {
    const root = tree()
    symlinkSync('../../.agents/skills/gone', join(root, '.claude/skills/gone'))
    expect(check(root)).toEqual([expect.stringContaining('gone: .claude/skills/gone has no skill')])
  })

  it('refuses a SKILL.md whose name is not its folder', () => {
    const root = tree()
    write(root, '.agents/skills/fork/SKILL.md', skillMd('forked'))
    expect(check(root)).toEqual([expect.stringContaining('fork: SKILL.md names "forked"')])
  })

  it('refuses a user-invoked skill that Codex would fire on its own', () => {
    const root = tree()
    write(root, '.agents/skills/fork/SKILL.md', skillMd('fork', true))
    expect(check(root)).toEqual([expect.stringContaining('fork: user-invoked in Claude Code and Cursor but not in Codex')])
  })

  it('refuses a skill hidden from the model in Codex only', () => {
    const root = tree()
    write(root, '.agents/skills/fork/agents/openai.yaml', openaiYaml(true))
    expect(check(root)).toEqual([expect.stringContaining('fork: user-invoked in Codex but not in Claude Code and Cursor')])
  })
})

describe('this repository', () => {
  it('names each repo-owned skill with a reason', () => {
    expect(Object.entries(REPO_OWNED_SKILLS).every(([, reason]) => reason.trim() !== '')).toBe(true)
  })

  it('has a skill tree that matches its lock', () => {
    expect(checkSkillsTree(ROOT, REPO_OWNED_SKILLS)).toEqual([])
  })
})
