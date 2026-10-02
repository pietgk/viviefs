/**
 * verify quality / guides (D62, D63, D66, D67, D81-D87). Every guide has the
 * pages, `##` headings and frontmatter keys of the guide template, which is
 * read from its files, so changing the template changes the rule. A guide's
 * ADRs, gates, exemplar projects and exercise track exist and point back; ADR
 * and guide statuses agree. References inside pages are the site build's to
 * check (D87). Pure over an injected view of the repository;
 * `check-guides.ts` reads the repository and runs it.
 */
import { parse } from 'yaml'

/** Where the guide template and the guides live (as in `apps/docs/src/lib/guides.ts`). */
export const TEMPLATE_DIRECTORY = 'apps/docs/src/guide-template'
export const GUIDES_DIRECTORY = 'apps/docs/src/content/docs/guides'

export type GuidesRepository = {
  /** Every file in the repository, repository-relative. */
  readonly paths: ReadonlyArray<string>
  readonly read: (path: string) => string | undefined
  /** The gate ids of the gate table. */
  readonly gates: ReadonlyArray<string>
  /** The pattern ids of the suite catalogue. */
  readonly patterns: ReadonlyArray<string>
}

type Page = { readonly data: Record<string, unknown>; readonly body: string }

/** Frontmatter keys only the published template has. */
const TEMPLATE_ONLY_KEYS = ['slug']
/** Frontmatter keys a guide has only in one state (D63). */
const CONDITIONAL_KEYS = ['accepted']

/** The gate table in code, the one home of gate names (D86), and its table in the plan. */
export const GATE_TABLE = 'tools/qualification/src/gates.ts'
export const GATE_TABLE_DOC = 'docs/plan/bootstrap/06-qualification-gates.md'

const unquote = (literal: string) => literal.slice(1, -1).replace(/\\'/g, "'")

/** Each gate's id, name and claim, from the gate table's source. */
export const parseGateTable = (source: string): ReadonlyArray<{ gate: string; name: string; claim: string }> =>
  source.split(/\n\s*\{\n/).flatMap((block) => {
    const gate = /gate: '(P\d\d)'/.exec(block)?.[1]
    const name = /name: ('(?:[^'\\]|\\.)*')/.exec(block)?.[1]
    const claim = /claim:\s*('(?:[^'\\]|\\.)*')/.exec(block)?.[1]
    return gate && name ? [{ gate, name: unquote(name), claim: claim === undefined ? '' : unquote(claim) }] : []
  })

/**
 * Guides show a gate by the name and claim in the gate table (D86, D93); the
 * plan's table must show the same name and, as its "Fact to establish", the
 * same claim. Checked here because `guides` also runs for a change that
 * touches only the plan.
 */
const gateNameProblems = (repository: GuidesRepository): string[] => {
  const table = repository.read(GATE_TABLE_DOC) ?? ''
  return parseGateTable(repository.read(GATE_TABLE) ?? '').flatMap(({ gate, name, claim }) => [
    ...(table.includes(`| **${gate}** ${name} |`) ? [] : [`${GATE_TABLE_DOC}: does not name ${gate} "${name}", as ${GATE_TABLE} does`]),
    ...(claim === ''
      ? [`${GATE_TABLE}: ${gate} has no claim (D93)`]
      : table.includes(`| **${gate}** ${name} | ${claim} |`)
        ? []
        : [`${GATE_TABLE_DOC}: ${gate}'s fact to establish is not its claim in ${GATE_TABLE}`]),
  ])
}

/** ADRs accepted directly, without a guide (D65). */
const ACCEPTED_DIRECTLY = ['0001', '0002']

const LESSON_FILE = /^lessons\/(\d\d)-[a-z0-9-]+\.mdx$/
const EXERCISE_FOLDER = /^(\d\d)\.(\d\d)-[a-z0-9-]+$/
const STATUSES = ['draft', 'in review', 'accepted']

export const splitPage = (path: string, source: string): Page => {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(source)
  if (!match) throw new Error(`${path}: no frontmatter`)
  const data: unknown = parse(match[1] ?? '')
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${path}: frontmatter is not a mapping`)
  }
  return { data: data as Record<string, unknown>, body: source.slice(match[0].length) }
}

const withoutFences = (body: string): string => body.replace(/^```[\s\S]*?^```$/gm, '')

/** The `## ` headings of a page, outside code fences. */
export const headingsOf = (body: string): ReadonlyArray<string> =>
  withoutFences(body)
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.slice(3).trim())

/** A template heading in square brackets stands for one or more headings. */
const isFreeHeading = (heading: string) => /^\[.+\]$/.test(heading)

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Whether `headings` have the shape of the template's `expected` headings. */
export const headingsMatch = (expected: ReadonlyArray<string>, headings: ReadonlyArray<string>): boolean => {
  const shape = expected.map((heading) => (isFreeHeading(heading) ? '(?:[^\\n]+\\n)+' : `${escape(heading)}\\n`)).join('')
  return new RegExp(`^${shape}$`).test(headings.map((heading) => `${heading}\n`).join(''))
}

const strings = (value: unknown): ReadonlyArray<string> | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : undefined

type TemplatePage = { readonly page: string; readonly headings: ReadonlyArray<string>; readonly keys: ReadonlyArray<string> }

/** The template's pages; every lesson file stands for `lessons/NN-*.mdx`. */
const templatePages = (repository: GuidesRepository): ReadonlyArray<TemplatePage> =>
  repository.paths
    .filter((path) => path.startsWith(`${TEMPLATE_DIRECTORY}/`) && path.endsWith('.mdx'))
    .map((path) => {
      const relative = path.slice(TEMPLATE_DIRECTORY.length + 1)
      const page = splitPage(path, repository.read(path) ?? '')
      return {
        page: LESSON_FILE.test(relative) ? 'lessons/NN' : relative,
        headings: headingsOf(page.body),
        keys: Object.keys(page.data).filter((key) => !TEMPLATE_ONLY_KEYS.includes(key) && !CONDITIONAL_KEYS.includes(key)),
      }
    })
    .filter((page, index, all) => all.findIndex(({ page: name }) => name === page.page) === index)

const directoryExists = (repository: GuidesRepository, directory: string) =>
  repository.paths.some((path) => path.startsWith(`${directory}/`))

type Guide = {
  readonly pattern: string
  readonly directory: string
  readonly pages: ReadonlyMap<string, Page>
  readonly index: Page | undefined
}

const guidesOf = (repository: GuidesRepository, problems: string[]): ReadonlyArray<Guide> => {
  const folders = new Set(
    repository.paths
      .filter((path) => path.startsWith(`${GUIDES_DIRECTORY}/`))
      .map((path) => path.slice(GUIDES_DIRECTORY.length + 1).split('/'))
      .filter((parts) => parts.length > 1)
      .map(([folder]) => folder ?? ''),
  )
  return [...folders].sort().map((pattern) => {
    const directory = `${GUIDES_DIRECTORY}/${pattern}`
    const pages = new Map<string, Page>()
    for (const path of repository.paths.filter((file) => file.startsWith(`${directory}/`))) {
      try {
        pages.set(path.slice(directory.length + 1), splitPage(path, repository.read(path) ?? ''))
      } catch (error) {
        problems.push((error as Error).message)
      }
    }
    return { pattern, directory, pages, index: pages.get('index.mdx') }
  })
}

const templateProblems = (guide: Guide, template: ReadonlyArray<TemplatePage>): string[] => {
  const problems: string[] = []
  const rule = (name: string) => template.find(({ page }) => page === (LESSON_FILE.test(name) ? 'lessons/NN' : name))
  for (const { page } of template) {
    if (page === 'lessons/NN') {
      if (![...guide.pages.keys()].some((name) => LESSON_FILE.test(name))) {
        problems.push(`${guide.directory}: no lesson (lessons/NN-name.mdx)`)
      }
    } else if (!guide.pages.has(page)) {
      problems.push(`${guide.directory}: no ${page}, a page of the guide template`)
    }
  }
  for (const [name, page] of guide.pages) {
    const path = `${guide.directory}/${name}`
    const expected = rule(name)
    if (!expected) {
      problems.push(`${path}: not a page of the guide template`)
      continue
    }
    const headings = headingsOf(page.body)
    if (!headingsMatch(expected.headings, headings)) {
      problems.push(`${path}: headings are [${headings.join(', ')}], the template has [${expected.headings.join(', ')}]`)
    }
    const missing = expected.keys.filter((key) => !(key in page.data))
    if (missing.length > 0) problems.push(`${path}: frontmatter lacks ${missing.join(', ')}`)
    for (const key of TEMPLATE_ONLY_KEYS) {
      if (key in page.data) problems.push(`${path}: frontmatter has ${key}, which only the published template has`)
    }
  }
  return problems
}

type Adr = { readonly id: string; readonly path: string; readonly status: string; readonly gates: ReadonlyArray<string>; readonly observed: boolean }

/** The text of an ADR's `### Observed` section, up to the next heading. */
export const observedOf = (source: string): string => {
  const marker = '\n### Observed\n'
  const start = source.indexOf(marker)
  if (start === -1) return ''
  const rest = source.slice(start + marker.length)
  const next = rest.search(/^#{1,3} /m)
  return (next === -1 ? rest : rest.slice(0, next)).trim()
}

const adrsOf = (repository: GuidesRepository): ReadonlyMap<string, Adr> =>
  new Map(
    repository.paths
      .filter((path) => /^docs\/adr\/\d{4}-[^/]+\.md$/.test(path))
      .map((path) => {
        const id = path.slice('docs/adr/'.length, 'docs/adr/'.length + 4)
        const source = repository.read(path) ?? ''
        return [
          id,
          {
            id,
            path,
            status: /^Status: (.+)$/m.exec(source)?.[1] ?? '',
            gates: [...(/^Qualifying gate: (.+)$/m.exec(source)?.[1] ?? '').matchAll(/P\d\d/g)].map(([gate]) => gate),
            observed: observedOf(source) !== '',
          },
        ] as const
      }),
  )

const projectGuides = (repository: GuidesRepository, project: string): ReadonlyArray<string> | undefined => {
  try {
    const parsed = JSON.parse(repository.read(`${project}/project.json`) ?? '') as { metadata?: { guides?: unknown } }
    return strings(parsed.metadata?.guides) ?? []
  } catch {
    return undefined
  }
}

const entryModule = (repository: GuidesRepository, project: string): string | undefined => {
  try {
    const parsed = JSON.parse(repository.read(`${project}/package.json`) ?? '') as {
      exports?: Record<string, unknown>
    }
    const entry = parsed.exports?.['.']
    const target = typeof entry === 'string' ? entry : (entry as Record<string, unknown> | undefined)?.['import']
    return typeof target === 'string' ? `${project}/${target.replace(/^\.\//, '')}` : undefined
  } catch {
    return undefined
  }
}

const indexProblems = (guide: Guide, repository: GuidesRepository, adrs: ReadonlyMap<string, Adr>): string[] => {
  const problems: string[] = []
  const index = guide.index
  if (!index) return problems
  const where = `${guide.directory}/index.mdx`
  const { data } = index
  if (data['pattern'] !== guide.pattern) problems.push(`${where}: pattern is ${String(data['pattern'])}, its folder is ${guide.pattern}`)
  if (!repository.patterns.includes(guide.pattern)) problems.push(`${where}: ${guide.pattern} is not a pattern in the suite catalogue`)
  const status = data['status']
  if (typeof status !== 'string' || !STATUSES.includes(status)) problems.push(`${where}: status must be one of ${STATUSES.join(', ')}`)
  const accepted = data['accepted']
  if (status === 'accepted' && !(typeof accepted === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(accepted))) {
    problems.push(`${where}: an accepted guide has an accepted date (YYYY-MM-DD)`)
  }
  if (status !== 'accepted' && accepted !== undefined) problems.push(`${where}: only an accepted guide has an accepted date`)

  const ids = strings(data['adrs']) ?? []
  if (strings(data['adrs']) === undefined) problems.push(`${where}: adrs must be a list of four-digit ids`)
  const qualifying = new Set<string>()
  for (const id of ids) {
    const adr = adrs.get(id)
    if (!adr) {
      problems.push(`${where}: ADR ${id} does not exist`)
      continue
    }
    for (const gate of adr.gates) qualifying.add(gate)
    if (status === 'accepted' && !adr.status.startsWith('Accepted')) {
      problems.push(`${where}: an accepted guide's ADR ${id} is ${adr.status}, not Accepted`)
    }
  }
  const gates = strings(data['gates']) ?? []
  for (const gate of gates) {
    if (!repository.gates.includes(gate)) problems.push(`${where}: gate ${gate} is not in the gate table`)
  }
  const expected = [...qualifying].sort()
  if ([...gates].sort().join() !== expected.join()) {
    problems.push(`${where}: gates are [${gates.join(', ')}]; its ADRs' qualifying gates are [${expected.join(', ')}]`)
  }

  const page = `guides/${guide.pattern}/`
  for (const project of strings(data['exemplar']) ?? []) {
    const guides = projectGuides(repository, project)
    if (guides === undefined) {
      problems.push(`${where}: exemplar ${project} has no project.json`)
      continue
    }
    if (!guides.includes(guide.pattern)) problems.push(`${where}: exemplar ${project} does not list "${guide.pattern}" in metadata.guides`)
    if (!(repository.read(`${project}/README.md`) ?? '').includes(page)) problems.push(`${project}/README.md: no link to ${page}`)
    const entry = entryModule(repository, project)
    if (entry === undefined || !(repository.read(entry) ?? '').includes(page)) {
      problems.push(`${entry ?? `${project}: entry module`}: TSDoc does not name ${page}`)
    }
  }
  return problems
}

const lessonProblems = (guide: Guide, repository: GuidesRepository): string[] => {
  const problems: string[] = []
  const numbers: number[] = []
  for (const [name, page] of guide.pages) {
    const match = LESSON_FILE.exec(name)
    if (!match) continue
    const path = `${guide.directory}/${name}`
    const number = Number(match[1])
    numbers.push(number)
    if (page.data['lesson'] !== number) problems.push(`${path}: lesson is ${String(page.data['lesson'])}, its file says ${number}`)
    const evidence = strings(page.data['evidence']) ?? []
    if (evidence.length === 0) problems.push(`${path}: a lesson cites at least one evidence note`)
    for (const note of evidence) {
      if (!note.startsWith('docs/evidence/') || repository.read(note) === undefined) {
        problems.push(`${path}: evidence ${note} is not a note under docs/evidence/`)
      }
    }
  }
  numbers.sort((a, b) => a - b)
  if (numbers.some((number, index) => number !== index + 1)) {
    problems.push(`${guide.directory}/lessons: numbered ${numbers.join(', ')}; lessons are numbered from 01 without gaps`)
  }
  return problems
}

/** D66: `NN.MM-name/{problem,solution}/` and one `exercise.test.ts`, numbered without gaps, one section per lesson. */
const exerciseProblems = (guide: Guide, repository: GuidesRepository): string[] => {
  const track = guide.index?.data['exercises']
  if (track === undefined) return []
  const where = `${guide.directory}/index.mdx`
  if (track !== `exercises/${guide.pattern}`) return [`${where}: exercises is ${String(track)}, the track is exercises/${guide.pattern}`]
  if (!directoryExists(repository, track)) return [`${where}: exercise track ${track} does not exist`]
  const problems: string[] = []
  try {
    const project = JSON.parse(repository.read(`${track}/project.json`) ?? '') as { tags?: ReadonlyArray<string> }
    if (!project.tags?.includes('kind:tool')) problems.push(`${track}/project.json: an exercise track is tagged kind:tool`)
  } catch {
    problems.push(`${track}: no project.json`)
  }
  const folders = [
    ...new Set(
      repository.paths
        .filter((path) => path.startsWith(`${track}/`))
        .map((path) => path.slice(track.length + 1).split('/'))
        .filter((parts) => parts.length > 1)
        .map(([folder]) => folder ?? ''),
    ),
  ].sort()
  const sections = new Map<number, number[]>()
  for (const folder of folders) {
    const match = EXERCISE_FOLDER.exec(folder)
    if (!match) {
      problems.push(`${track}/${folder}: not an exercise folder (NN.MM-name)`)
      continue
    }
    const base = `${track}/${folder}`
    for (const part of ['problem', 'solution']) {
      if (!directoryExists(repository, `${base}/${part}`)) problems.push(`${base}: no ${part}/`)
    }
    if (repository.read(`${base}/exercise.test.ts`) === undefined) problems.push(`${base}: no exercise.test.ts`)
    const section = Number(match[1])
    sections.set(section, [...(sections.get(section) ?? []), Number(match[2])])
  }
  const numbers = [...sections.keys()].sort((a, b) => a - b)
  if (numbers.some((number, index) => number !== index + 1)) {
    problems.push(`${track}: sections ${numbers.join(', ')}; sections are numbered from 01 without gaps`)
  }
  for (const [section, items] of sections) {
    if (items.sort((a, b) => a - b).some((item, index) => item !== index + 1)) {
      problems.push(`${track}: section ${section} has exercises ${items.join(', ')}; numbered from 01 without gaps`)
    }
  }
  const lessons = [...guide.pages.keys()].flatMap((name) => {
    const match = LESSON_FILE.exec(name)
    return match ? [Number(match[1])] : []
  })
  if ([...lessons].sort((a, b) => a - b).join() !== numbers.join()) {
    problems.push(`${guide.directory}: lessons [${lessons.join(', ')}] and exercise sections [${numbers.join(', ')}] pair one to one (D81)`)
  }
  return problems
}

export const guideProblems = (repository: GuidesRepository): ReadonlyArray<string> => {
  const problems: string[] = []
  const template = templatePages(repository)
  if (template.length === 0) return [`${TEMPLATE_DIRECTORY}: the guide template has no pages`]
  problems.push(...gateNameProblems(repository))
  const guides = guidesOf(repository, problems)
  const adrs = adrsOf(repository)

  const namedBy = new Map<string, string[]>()
  for (const guide of guides) {
    problems.push(...templateProblems(guide, template))
    problems.push(...indexProblems(guide, repository, adrs))
    problems.push(...lessonProblems(guide, repository))
    problems.push(...exerciseProblems(guide, repository))
    for (const id of strings(guide.index?.data['adrs']) ?? []) namedBy.set(id, [...(namedBy.get(id) ?? []), guide.pattern])
  }
  for (const [id, names] of namedBy) {
    if (names.length > 1) problems.push(`ADR ${id} is named by guides ${names.join(', ')}; every ADR is named by one guide (D82)`)
  }

  const acceptedGuides = guides.filter((guide) => guide.index?.data['status'] === 'accepted')
  for (const adr of adrs.values()) {
    if (!adr.status.startsWith('Accepted')) continue
    const onGuide = acceptedGuides.some((guide) => (strings(guide.index?.data['adrs']) ?? []).includes(adr.id))
    if (!onGuide && !ACCEPTED_DIRECTLY.includes(adr.id)) {
      problems.push(`${adr.path}: Accepted, but no accepted guide names it (D63)`)
    }
    if (adr.gates.some((gate) => !repository.gates.includes(gate)) || !adr.observed) {
      problems.push(`${adr.path}: Accepted, but only a Qualified ADR (its gates in the gate table, an Observed entry) is accepted (D63)`)
    }
  }

  const guideNames = new Set(guides.map(({ pattern }) => pattern))
  for (const path of repository.paths.filter((file) => file.endsWith('/project.json'))) {
    const project = path.slice(0, -'/project.json'.length)
    for (const name of projectGuides(repository, project) ?? []) {
      if (!guideNames.has(name)) {
        problems.push(`${path}: metadata.guides names "${name}", which has no guide`)
        continue
      }
      const guide = guides.find(({ pattern }) => pattern === name)
      if (!(strings(guide?.index?.data['exemplar']) ?? []).includes(project)) {
        problems.push(`${path}: metadata.guides names "${name}", whose exemplar does not list ${project}`)
      }
    }
  }
  return problems
}
