/**
 * The vendored skill tree matches skills-lock.json (ADR-0027). Rules and their
 * failing cases are in skills-tree.test.ts.
 */
import { REPO_OWNED_SKILLS, checkSkillsTree } from './skills-tree.ts'

const problems = checkSkillsTree(process.cwd(), REPO_OWNED_SKILLS)

if (problems.length > 0) {
  throw new Error(
    `The skill tree does not match skills-lock.json:\n${problems.map((line) => `  ${line}`).join('\n')}`,
  )
}

console.log(
  `Skill tree: matches skills-lock.json; ${Object.keys(REPO_OWNED_SKILLS).length} repo-owned skill(s).`,
)
