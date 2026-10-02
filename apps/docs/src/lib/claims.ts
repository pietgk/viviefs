/**
 * Reference > Claims (D93), generated: every claim the stack depends on, the
 * gate that proves it, how it is proven, the ADRs that depend on it and the
 * evidence notes of its runs. Sources: the gate table in code (`gates.ts`:
 * name and claim), the plan's gate table (pass condition, positive
 * control), the ADRs' `Qualifying gate:` lines and `docs/evidence`.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { siteUrlFor } from './repo.ts'

/** The gate table in code: the one home of gate names and claims. */
export const GATE_TABLE = 'tools/qualification/src/gates.ts'
export const GATE_TABLE_DOC = 'docs/plan/bootstrap/06-qualification-gates.md'
export const CLAIMS_ROUTE = 'reference/claims'

const unquote = (literal: string): string => literal.slice(1, -1).replace(/\\'/g, "'")

export type GateClaim = { readonly id: string; readonly name: string; readonly claim: string }

/** Each gate's id, name and claim, from the gate table's source. */
export const parseGateClaims = (source: string): ReadonlyArray<GateClaim> =>
  source.split(/\n\s*\{\n/).flatMap((block) => {
    const id = /gate: '(P\d\d)'/.exec(block)?.[1]
    const name = /name: ('(?:[^'\\]|\\.)*')/.exec(block)?.[1]
    const claim = /claim:\s*('(?:[^'\\]|\\.)*')/.exec(block)?.[1]
    return id && name && claim ? [{ id, name: unquote(name), claim: unquote(claim) }] : []
  })

/** Pass condition and positive control per gate, from the plan's gate table. */
export const parsePlanRows = (
  source: string,
): ReadonlyMap<string, { readonly passCondition: string; readonly positiveControl: string }> =>
  new Map(
    source.split('\n').flatMap((line) => {
      if (!/^\| \*\*P\d\d\*\* /.test(line)) return []
      const cells = line.split(' | ').map((cell) => cell.replace(/^\| |\s*\|$/g, '').trim())
      const id = /\*\*(P\d\d)\*\*/.exec(cells[0] ?? '')?.[1]
      return id ? [[id, { passCondition: cells[2] ?? '', positiveControl: cells[3] ?? '' }] as const] : []
    }),
  )

/** The anchor Starlight gives the claim's heading, `## P04 Log store conformance`. */
export const claimAnchor = (claim: Pick<GateClaim, 'id' | 'name'>): string =>
  `${claim.id} ${claim.name}`
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/ /g, '-')

/** Where a gate reference points: its claim on the Claims page. */
export const claimHref = (claim: Pick<GateClaim, 'id' | 'name'>): string => `/${CLAIMS_ROUTE}/#${claimAnchor(claim)}`

const titleOf = (source: string, fallback: string) => /^# (.+)$/m.exec(source)?.[1]?.replace(/`/g, '').trim() ?? fallback

/** The evidence notes of a gate: its dated runs, its design reviews, and the closure runs that name it. */
export const evidenceNotes = (root: string, id: string): ReadonlyArray<{ readonly path: string; readonly title: string }> => {
  const directory = join(root, 'docs/evidence')
  const lower = id.toLowerCase()
  return readdirSync(directory)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .sort()
    .flatMap((name) => {
      const source = readFileSync(join(directory, name), 'utf8')
      const own = name.endsWith(`-${lower}.md`) || name.startsWith(`${lower}-`)
      const closure = name.includes('closure') && new RegExp(`\\b${id}\\b`).test(source)
      return own || closure ? [{ path: `docs/evidence/${name}`, title: titleOf(source, name) }] : []
    })
}

/** ADR ids whose qualifying gates include the gate. */
export const dependentAdrs = (root: string, id: string): ReadonlyArray<string> =>
  readdirSync(join(root, 'docs/adr'))
    .filter((name) => /^\d{4}-.+\.md$/.test(name))
    .sort()
    .flatMap((name) => {
      const line = /^Qualifying gate: (.+)$/m.exec(readFileSync(join(root, 'docs/adr', name), 'utf8'))?.[1] ?? ''
      return new RegExp(`\\b${id}\\b`).test(line) ? [`ADR-${name.slice(0, 4)}`] : []
    })

/** A table cell as a sentence: ends with a full stop. */
const sentence = (text: string): string => (/[.!?)]$/.test(text) ? text : `${text}.`)

const readIfExists = (path: string) => (existsSync(path) ? readFileSync(path, 'utf8') : '')

/** The Markdown of the Claims page. Gate and ADR ids in it render as named links. */
export const claimsMarkdown = (root: string): string => {
  const plan = parsePlanRows(readIfExists(join(root, GATE_TABLE_DOC)))
  const sections = parseGateClaims(readIfExists(join(root, GATE_TABLE))).map((gate) => {
    const row = plan.get(gate.id)
    const adrs = dependentAdrs(root, gate.id)
    const notes = evidenceNotes(root, gate.id)
    const evidence =
      notes.length === 0
        ? 'none yet: the gate has not run.'
        : notes.map(({ path, title }) => `[${title}](${siteUrlFor(path) ?? path})`).join(', ')
    return [
      `## ${gate.id} ${gate.name}`,
      '',
      `**Claim:** ${sentence(gate.claim)}`,
      '',
      `**Proven when:** ${row === undefined ? 'set by its grilling.' : sentence(row.passCondition)}`,
      '',
      `**Positive control:** ${row === undefined ? 'set by its grilling.' : sentence(row.positiveControl)}`,
      '',
      `**ADRs that depend on it:** ${adrs.length === 0 ? 'none yet.' : `${adrs.join(', ')}.`}`,
      '',
      `**Evidence:** ${evidence}`,
    ].join('\n')
  })
  return [
    'A **claim** is a statement the stack depends on that could be false. Each gate proves exactly one claim, so P is for',
    'proof: P04 is the proof of the log store claim. A gate runs a retained probe with a positive control, `pnpm qualify`',
    'records every run in the ledger, and an evidence note describes the run. An ADR is Qualified when the gates it names',
    'have passed.',
    '',
    'Generated from the gate table in code (`tools/qualification/src/gates.ts`), the plan\'s gate table',
    '(`docs/plan/bootstrap/06-qualification-gates.md`), the ADRs and `docs/evidence`.',
    '',
    ...sections.flatMap((section) => [section, '']),
  ].join('\n')
}
