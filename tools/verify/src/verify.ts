import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { appendFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  ROOT,
  STAGES,
  findStage,
  findStep,
  formatHelp,
} from './stages.ts'
import type { Invocation, Step } from './stages.ts'

const PASS = 'PASS'
const FAIL = 'FAIL'
const SKIP = 'SKIP'
const DIM = '\u001b[2m'
const RESET = '\u001b[0m'
const NAME_COLUMN_GAP = 1
const NAME_COLUMN_WIDTH =
  Math.max(
    ...STAGES.flatMap(({ name, steps }) => [
      name.length,
      ...steps.map(({ name: stepName }) => stepName.length),
    ]),
  ) + NAME_COLUMN_GAP
const STATUS_COLUMN_WIDTH = 6
const SECONDS_COLUMN_WIDTH = 7
const CLI_USAGE_EXIT_CODE = 2
const FAILURE_DIVIDER_LENGTH = 60

const OFFLINE_SIGNS = [
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENETUNREACH',
  'ERR_SOCKET_CONNECTION_TIMEOUT',
]

const NX_EMPTY_PATTERNS = [
  'No projects were found',
  'No projects matched',
  'NX   No tasks were run',
]

const assertNodeVersion = async () => {
  const mise = await readFile(resolve(ROOT, 'mise.toml'), 'utf8')
  const pinned = mise.match(/^node\s*=\s*"([^"]+)"/m)?.[1]
  if (!pinned) {
    process.stderr.write('mise.toml does not pin node.\n')
    process.exit(1)
  }
  if (process.versions.node === pinned) return
  process.stderr.write(
    `This repo runs Node ${pinned}; this shell is Node ${process.versions.node}.\n` +
      `Run through mise (\`mise exec -- pnpm verify\`) or activate it in your shell.\n`,
  )
  process.exit(1)
}

const runInvocation = ({
  command,
  args,
  cwd,
  env,
  tolerateOffline,
}: Invocation): Promise<{
  ok: boolean
  offline: boolean
  empty: boolean
  output: string
}> =>
  new Promise((settle) => {
    const child = spawn(command, args, {
      cwd: cwd ?? ROOT,
      env: { ...process.env, ...env, FORCE_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    const collect = (chunk: Buffer | string) => {
      output = `${output}${chunk}`
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    child.on('error', (error) => collect(`${error}\n`))
    child.on('close', (code) => {
      const offline =
        Boolean(tolerateOffline) &&
        code !== 0 &&
        OFFLINE_SIGNS.some((sign) => output.includes(sign))
      const empty = NX_EMPTY_PATTERNS.some((sign) => output.includes(sign))
      settle({
        ok: code === 0 || offline || empty,
        offline,
        empty,
        output,
      })
    })
  })

type Row = {
  name: string
  status: string
  seconds: number
  output: string
  note?: string
}

const runStep = async (step: Step): Promise<Row> => {
  const startedAt = Date.now()
  const results = []
  for (const invocation of step.invocations) {
    results.push(await runInvocation(invocation))
  }
  const failed = results.filter((result) => !result.ok)
  const skipped =
    failed.length === 0 &&
    results.some((result) => result.offline || result.empty)
  const note = results.some((result) => result.empty)
    ? 'no projects declare this target'
    : results.some((result) => result.offline)
      ? 'offline; last lockfile answer still holds'
      : undefined
  return {
    name: step.name,
    status: failed.length > 0 ? FAIL : skipped ? SKIP : PASS,
    seconds: (Date.now() - startedAt) / 1000,
    output: failed.map((result) => result.output).join('\n'),
    note,
  }
}

const formatRow = ({ name, status, seconds, note }: Row) =>
  `  ${name.padEnd(NAME_COLUMN_WIDTH)}${status.padEnd(STATUS_COLUMN_WIDTH)}${`${seconds.toFixed(1)}s`.padStart(SECONDS_COLUMN_WIDTH)}` +
  (note ? `   ${note}` : '')

const selectStages = (selectors: string[]) => {
  if (selectors.length === 0) return STAGES
  const wanted = new Set<string>()
  for (const selector of selectors) {
    const stage = findStage(selector)
    if (stage) {
      for (const step of stage.steps) wanted.add(step.name)
      continue
    }
    const step = findStep(selector)
    if (!step) {
      process.stderr.write(
        `Unknown stage or step: ${selector}\nTry: pnpm verify help\n`,
      )
      process.exit(CLI_USAGE_EXIT_CODE)
    }
    wanted.add(step.name)
  }
  return STAGES.map((stage) => ({
    ...stage,
    steps: stage.steps.filter((step) => wanted.has(step.name)),
  })).filter((stage) => stage.steps.length > 0)
}

const main = async () => {
  const selectors = process.argv.slice(2)
  if (selectors.includes('help')) {
    process.stdout.write(formatHelp())
    return
  }
  await assertNodeVersion()

  const stages = selectStages(selectors)
  const rows = []
  let red = false

  for (const stage of stages) {
    for (const step of stage.steps) {
      const result = await runStep(step)
      rows.push(result)
      process.stdout.write(`${formatRow(result)}\n`)
      if (result.status === FAIL) red = true
    }
    if (red) break
  }

  const failures = rows.filter((row) => row.status === FAIL)
  const verdict = red
    ? `  RED · ${failures.length} of ${rows.length} failed`
    : `  GREEN · ${rows.length} ${rows.length === 1 ? 'check' : 'checks'}`

  process.stdout.write(`\n${verdict}\n`)

  const links = rows
    .filter((row) => row.status !== SKIP)
    .map((row) => {
      const artifact = findStep(row.name)?.artifact
      if (!artifact) return null
      const path = resolve(ROOT, artifact)
      if (!existsSync(path)) return null
      return `  ${row.name.padEnd(NAME_COLUMN_WIDTH)}${DIM}${pathToFileURL(path).href}${RESET}`
    })
    .filter((link) => link !== null)
  if (links.length > 0) process.stdout.write(`\n${links.join('\n')}\n`)

  for (const failure of failures) {
    process.stdout.write(
      `\n${'-'.repeat(FAILURE_DIVIDER_LENGTH)}\n${failure.name}\n${'-'.repeat(FAILURE_DIVIDER_LENGTH)}\n`,
    )
    process.stdout.write(failure.output)
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      ['```', ...rows.map(formatRow), '', verdict, '```', ''].join('\n'),
    )
  }

  process.exit(red ? 1 : 0)
}

await main()
