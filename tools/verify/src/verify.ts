import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { appendFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { NodeRuntime, NodeServices } from '@effect/platform-node'
import { Clock, Effect, Runtime, Schema } from 'effect'
import { Argument, Command } from 'effect/unstable/cli'
import {
  ROOT,
  STAGES,
  findStep,
  formatHelp,
  selectStages,
} from './stages.ts'
import type { Invocation, Stage, Step } from './stages.ts'

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

class UnknownSelectorError extends Schema.TaggedError<UnknownSelectorError>()(
  'UnknownSelectorError',
  { selector: Schema.String },
) {
  override readonly [Runtime.errorExitCode] = 2
  override readonly [Runtime.errorReported] = false
}

class NodeVersionError extends Schema.TaggedError<NodeVersionError>()(
  'NodeVersionError',
  { message: Schema.String },
) {
  override readonly [Runtime.errorExitCode] = 1
  override readonly [Runtime.errorReported] = false
}

class VerifyFailed extends Schema.TaggedError<VerifyFailed>()('VerifyFailed', {
  failed: Schema.Finite,
  ran: Schema.Finite,
}) {
  override readonly [Runtime.errorExitCode] = 1
  override readonly [Runtime.errorReported] = false
}

const writeOut = (text: string) =>
  Effect.sync(() => {
    process.stdout.write(text)
  })

const writeErr = (text: string) =>
  Effect.sync(() => {
    process.stderr.write(text)
  })

const assertNodeVersion = Effect.fnUntraced(function* () {
  const mise = yield* Effect.tryPromise({
    try: () => readFile(resolve(ROOT, 'mise.toml'), 'utf8'),
    catch: (error) =>
      new NodeVersionError({ message: String(error) }),
  })
  const pinned = mise.match(/^node\s*=\s*"([^"]+)"/m)?.[1]
  if (!pinned) {
    const message = 'mise.toml does not pin node.\n'
    yield* writeErr(message)
    return yield* new NodeVersionError({ message })
  }
  if (process.versions.node === pinned) return
  const message =
    `This repo runs Node ${pinned}; this shell is Node ${process.versions.node}.\n` +
    `Run through mise (\`mise exec -- pnpm verify\`) or activate it in your shell.\n`
  yield* writeErr(message)
  return yield* new NodeVersionError({ message })
})

const runInvocation = (
  invocation: Invocation,
): Effect.Effect<{
  ok: boolean
  offline: boolean
  empty: boolean
  output: string
}> =>
  Effect.promise(
    () =>
      new Promise((settle) => {
        const child = spawn(invocation.command, invocation.args, {
          cwd: invocation.cwd ?? ROOT,
          env: { ...process.env, ...invocation.env, FORCE_COLOR: '1' },
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
            Boolean(invocation.tolerateOffline) &&
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
      }),
  )

type Row = {
  name: string
  status: string
  seconds: number
  output: string
  note?: string
}

const runStep = Effect.fnUntraced(function* (step: Step) {
  const startedAt = yield* Clock.currentTimeMillis
  const results = []
  for (const invocation of step.invocations) {
    results.push(yield* runInvocation(invocation))
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
  const endedAt = yield* Clock.currentTimeMillis
  return {
    name: step.name,
    status: failed.length > 0 ? FAIL : skipped ? SKIP : PASS,
    seconds: (endedAt - startedAt) / 1000,
    output: failed.map((result) => result.output).join('\n'),
    ...(note === undefined ? {} : { note }),
  } satisfies Row
})

const formatRow = ({ name, status, seconds, note }: Row) =>
  `  ${name.padEnd(NAME_COLUMN_WIDTH)}${status.padEnd(STATUS_COLUMN_WIDTH)}${`${seconds.toFixed(1)}s`.padStart(SECONDS_COLUMN_WIDTH)}` +
  (note ? `   ${note}` : '')

const runStages = Effect.fnUntraced(function* (stages: Stage[]) {
  const rows: Row[] = []
  let red = false

  for (const stage of stages) {
    for (const step of stage.steps) {
      const result = yield* runStep(step)
      rows.push(result)
      yield* writeOut(`${formatRow(result)}\n`)
      if (result.status === FAIL) red = true
    }
    if (red) break
  }

  const failures = rows.filter((row) => row.status === FAIL)
  const verdict = red
    ? `  RED · ${failures.length} of ${rows.length} failed`
    : `  GREEN · ${rows.length} ${rows.length === 1 ? 'check' : 'checks'}`

  yield* writeOut(`\n${verdict}\n`)

  const links = rows
    .filter((row) => row.status !== SKIP)
    .map((row) => {
      const artifact = findStep(row.name)?.artifact
      if (!artifact) return null
      const artifactPath = resolve(ROOT, artifact)
      if (!existsSync(artifactPath)) return null
      return `  ${row.name.padEnd(NAME_COLUMN_WIDTH)}${DIM}${pathToFileURL(artifactPath).href}${RESET}`
    })
    .filter((link) => link !== null)
  if (links.length > 0) yield* writeOut(`\n${links.join('\n')}\n`)

  for (const failure of failures) {
    yield* writeOut(
      `\n${'-'.repeat(FAILURE_DIVIDER_LENGTH)}\n${failure.name}\n${'-'.repeat(FAILURE_DIVIDER_LENGTH)}\n`,
    )
    yield* writeOut(failure.output)
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    yield* Effect.promise(() =>
      appendFile(
        process.env.GITHUB_STEP_SUMMARY!,
        ['```', ...rows.map(formatRow), '', verdict, '```', ''].join('\n'),
      ),
    ).pipe(Effect.ignore)
  }

  if (red) {
    return yield* new VerifyFailed({
      failed: failures.length,
      ran: rows.length,
    })
  }
})

const selectors = Argument.String('selector').pipe(
  Argument.withDescription('stage or step name'),
  Argument.variadic(),
)

export const verify = Command.make(
  'verify',
  { selectors },
  Effect.fnUntraced(function* ({ selectors: names }) {
    if (names.includes('help')) {
      yield* writeOut(formatHelp())
      return
    }
    yield* assertNodeVersion()
    const selected = selectStages(names)
    if (selected._tag === 'Unknown') {
      yield* writeErr(
        `Unknown stage or step: ${selected.selector}\nTry: pnpm verify help\n`,
      )
      return yield* new UnknownSelectorError({ selector: selected.selector })
    }
    yield* runStages(selected.stages)
  }),
).pipe(
  Command.withDescription(
    'Staged verify gate. A failing stage stops the ones after it.',
  ),
)

const program = verify.pipe(
  Command.run({ version: '0.0.0' }),
  Effect.provide(NodeServices.layer),
)

NodeRuntime.runMain(program)
