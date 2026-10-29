/**
 * The research index (D68): every record in `docs/research/` is named
 * `YYYY-MM-DD-<topic>` with `.md` or `.html`, as the index asks, and has a row
 * in the index, so a reader finds it; every record the index links exists.
 * Writing the row was a habit, and three review pages went unlisted for a
 * day; a mechanical rule is a check.
 */

export const RESEARCH_DIR = 'docs/research'
export const RESEARCH_INDEX = `${RESEARCH_DIR}/README.md`

const RECORD_NAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]*\.(?:md|html)$/

/** The records among repository paths: every file under `docs/research/` but the index, by its path there. */
export const researchRecords = (paths: ReadonlyArray<string>): ReadonlyArray<string> =>
  paths.flatMap((path) => (path.startsWith(`${RESEARCH_DIR}/`) && path !== RESEARCH_INDEX ? [path.slice(RESEARCH_DIR.length + 1)] : []))

/** The records the index links: a link target in this folder, without its anchor. */
const linkedRecords = (index: string): ReadonlySet<string> =>
  new Set(
    [...index.matchAll(/\]\(([^)\s#]+)(?:#[^)]*)?\)/g)]
      .map(([, target = '']) => target)
      .filter((target) => !target.includes('/') && !target.includes(':')),
  )

/** Each record not named by its date or not in the index, and each link in the index to no record. */
export const researchIndexProblems = (records: ReadonlyArray<string>, index: string): ReadonlyArray<string> => {
  const linked = linkedRecords(index)
  const known = new Set(records)
  return [
    ...records.flatMap((record) => [
      ...(RECORD_NAME.test(record) ? [] : [`${RESEARCH_DIR}/${record}: name a record YYYY-MM-DD-<topic>.md or .html`]),
      ...(linked.has(record) ? [] : [`${RESEARCH_DIR}/${record}: not in the index; add its row to ${RESEARCH_INDEX}`]),
    ]),
    ...[...linked].filter((target) => !known.has(target)).map((target) => `${RESEARCH_INDEX}: links ${target}, which is not a record here`),
  ]
}
