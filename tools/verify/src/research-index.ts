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

const label = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase()

/** A link destination as a path in this folder: no brackets, query or anchor, decoded, without `./`. */
const localTarget = (destination: string): string => {
  const path = destination.replace(/^<(.*)>$/, '$1').replace(/[?#].*$/, '')
  let decoded = path
  try {
    decoded = decodeURIComponent(path)
  } catch {
    // A malformed escape is kept as written, and then names no record.
  }
  return decoded.replace(/^(?:\.\/)+/, '')
}

const DEFINITION = /^ {0,3}\[([^\]]+)\]:[ \t]*(<[^>\n]*>|\S+)(?:[ \t]+(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\)))?[ \t]*$/gm
// One scan, left to right, so the label of a full reference is never read again as a shortcut.
const LINK =
  /\[((?:[^[\]\n]|\[[^[\]\n]*\])*)\](?:\(\s*(<[^>\n]*>|[^\s)]+)(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\s*\)|\[([^[\]\n]*)\])?/g

/**
 * The records the index links, in every form of a Markdown link that renders:
 * inline (`./`, angle brackets, a title, a query or an anchor allowed) and
 * full, collapsed and shortcut references with their definition. A code span
 * and a definition no link uses render no link.
 */
const linkedRecords = (index: string): ReadonlySet<string> => {
  const prose = index.replace(/(`+)[^`][\s\S]*?\1/g, '')
  const definitions = new Map<string, string>()
  const body = prose.replace(DEFINITION, (_, name: string, destination: string) => {
    if (!definitions.has(label(name))) definitions.set(label(name), destination)
    return ''
  })
  const destinations = [...body.matchAll(LINK)].flatMap(([, text = '', inline, reference]) => {
    if (inline !== undefined) return [inline]
    const destination = definitions.get(label(reference === undefined || reference === '' ? text : reference))
    return destination === undefined ? [] : [destination]
  })
  return new Set(destinations.map(localTarget).filter((target) => target !== '' && !target.includes('/') && !target.includes(':')))
}

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
