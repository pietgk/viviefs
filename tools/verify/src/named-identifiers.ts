/**
 * Names the stack owns (D180): where a living document names a `project.json`
 * `metadata` key, a `pnpm` script, a `verify` step or a `viviefs/` name, the
 * stack must have it, so a rename fails wherever a document still uses the old
 * name. Prose names them in code font; a diagram label is prose with no code
 * font, so its whole text is read. A wrong meaning is not checked here: that
 * stays with a reader (D96). Another project's words are theirs (D204).
 */
import { DECISION_LOG, diagramLabels, inlineItems, proseLines, quotedLines, theirWords } from '@viviefs/references'
import { GLOSSARY_FILE, isLivingDocument } from './glossary-report.ts'

/** The docs site's own pages, such as How a pattern is delivered, written as living documents are. */
const SITE_PAGE = /^apps\/docs\/src\/content\/docs\/.+\.mdx?$/

/**
 * Whether a file is read: a living document (D173), the glossary and the
 * site's own pages, less the decision log, whose rows are kept as written.
 */
export const isCheckedForNamedIdentifiers = (path: string, content: string): boolean =>
  path !== DECISION_LOG && (path === GLOSSARY_FILE || SITE_PAGE.test(path) || isLivingDocument(path, content))

/** The names the stack has, read from the repository. */
export type StackNames = {
  /** Every key of a `project.json` `metadata` object, and the keys `verify` refuses there. */
  readonly metadataKeys: ReadonlySet<string>
  readonly scripts: ReadonlySet<string>
  readonly verifySelectors: ReadonlySet<string>
  readonly viviefsNames: ReadonlySet<string>
}

/** One name a document writes, the line it is on, and the prose right after it. */
type Named = { readonly line: number; readonly text: string; readonly after: string }

/** pnpm's own commands, which a root script does not shadow (`pnpm docs` is pnpm's). */
export const PNPM_COMMANDS: ReadonlySet<string> = new Set([
  'add', 'approve-builds', 'audit', 'bin', 'config', 'create', 'dedupe', 'deploy', 'dlx', 'docs', 'env', 'exec',
  'fetch', 'i', 'import', 'init', 'install', 'licenses', 'link', 'list', 'ls', 'outdated', 'pack', 'patch', 'peers',
  'prune', 'publish', 'rebuild', 'remove', 'rm', 'root', 'run', 'self-update', 'setup', 'store', 'test', 'unlink',
  'up', 'update', 'why',
])

/** A word that can be a selector; a flag, a placeholder or an option value is not one. */
const SELECTOR = /^[a-z][a-z-]*$/

const selectorProblems = (selectors: ReadonlyArray<string>, written: string, names: StackNames): ReadonlyArray<string> =>
  selectors.flatMap((selector) =>
    SELECTOR.test(selector) && !names.verifySelectors.has(selector)
      ? [`\`${selector}\` is not a verify stage or step (${written})`]
      : [],
  )

const pnpmProblems = ({ text }: Named, names: StackNames): ReadonlyArray<string> =>
  [...text.matchAll(/(?<![\w-])pnpm((?:\s+[^\s;|&]+)+)/g)].flatMap(([written, rest = '']) => {
    const [command = '', ...args] = rest.trim().split(/\s+/)
    if (command.startsWith('-') || command.startsWith('<')) return []
    const script = command === 'run' ? (args.shift() ?? '') : command
    if (command !== 'run' && PNPM_COMMANDS.has(command)) return []
    if (!names.scripts.has(script)) return [`\`pnpm ${command}\` is neither a root package.json script nor a pnpm command`]
    return script === 'verify' ? selectorProblems(args, written, names) : []
  })

/**
 * A `viviefs/` name: an attribute or a service key the code defines. The bare
 * namespace and `viviefs/...` name no one name; a wildcard or a trailing `/`
 * names a prefix some defined name has. A package, `@viviefs/datom`, is not one.
 */
const viviefsProblems = ({ text }: Named, names: StackNames): ReadonlyArray<string> =>
  [...text.matchAll(/(?<![@\w/.-])viviefs\/[\w./*-]*/g)].flatMap(([written]) => {
    const name = written.replace(/(?<!\.\.)\.$/, '')
    if (name === 'viviefs/' || name === 'viviefs/...' || names.viviefsNames.has(name)) return []
    const prefix = /^(.*\/)\*?$/.exec(name)?.[1]
    if (prefix !== undefined && [...names.viviefsNames].some((known) => known.startsWith(prefix))) return []
    return [`\`${name}\` is not a name the code defines`]
  })

/** `verify all` in code font, and a code-font word followed by "step" or "stage". */
const verifyProblems = ({ text, after }: Named, names: StackNames): ReadonlyArray<string> => {
  const invoked = /^verify((?:\s+\S+)+)$/.exec(text)
  if (invoked?.[1] !== undefined) return selectorProblems(invoked[1].trim().split(/\s+/), text, names)
  const step = /^ (steps?|stages?)\b/.exec(after)
  if (step?.[1] === undefined || text === 'verify') return []
  return selectorProblems([text], `\`${text}\` ${step[1]}`, names)
}

const metadataProblems = ({ text }: Named, names: StackNames): ReadonlyArray<string> =>
  [...text.matchAll(/(?<![\w.])metadata\.([A-Za-z_]\w*)/g)].flatMap(([written, key = '']) =>
    names.metadataKeys.has(key) ? [] : [`no project.json has the metadata key \`${key}\` (${written})`],
  )

/**
 * What a document names, in document order: each code span in its prose, and
 * each diagram label whole, outside a block quote and another project's words.
 */
const namedIn = (content: string): ReadonlyArray<Named> => {
  const lines = proseLines(content)
  const quoted = quotedLines(lines)
  const text = lines.join('\n')
  const lineStart = (line: number) => lines.slice(0, line - 1).reduce((offset, prose) => offset + prose.length + 1, 0)
  const labels = diagramLabels(content)
  const labelLines = new Set(labels.map(({ line }) => line))
  const events = [
    ...inlineItems(text).map((item) => ({ at: item.start, line: text.slice(0, item.start).split('\n').length, item })),
    ...labels.map(({ line, text: label }) => ({ at: lineStart(line), line, label })),
  ].sort((left, right) => left.at - right.at)
  const marks = theirWords()
  const found: Named[] = []
  for (const event of events) {
    if ('item' in event && event.item.kind === 'comment') {
      marks.read(event.item.text)
      continue
    }
    if (quoted[event.line - 1] === true || marks.inside()) continue
    // A label is read whole, so a code span inside it is not read twice.
    if ('label' in event) found.push({ line: event.line, text: event.label, after: '' })
    else if (!labelLines.has(event.line)) {
      found.push({ line: event.line, text: event.item.text, after: text.slice(event.item.end, event.item.end + 12) })
    }
  }
  return found
}

/** Each place a document names something the stack does not have. */
export const namedIdentifierProblems = (path: string, content: string, names: StackNames): ReadonlyArray<string> =>
  namedIn(content).flatMap((named) =>
    [...metadataProblems(named, names), ...pnpmProblems(named, names), ...verifyProblems(named, names), ...viviefsProblems(named, names)].map((problem) => `${path}:${named.line}: ${problem}; write a name the stack has (D180)`),
  )
