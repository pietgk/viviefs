import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { NodeRuntime, NodeServices } from '@effect/platform-node'
import { Console, Effect, Option, Runtime, Schema } from 'effect'
import { CliError, Command, Flag } from 'effect/unstable/cli'
import { command } from './process.ts'
import { beginGate, ledgerState, recordGate } from './ledger.ts'
import { foundationGates, gateProbes, implementedGates } from './gates.ts'

export const USAGE = `Usage: pnpm qualify [--gate Pnn | --foundation]. pnpm ledger prints cumulative state. Gates: ${implementedGates.join(', ')}.`

class UsageError extends Schema.TaggedError<UsageError>()('UsageError', {
  message: Schema.String,
}) {
  override readonly [Runtime.errorExitCode] = 1
  override readonly [Runtime.errorReported] = false
}

class QualifyFailed extends Schema.TaggedError<QualifyFailed>()(
  'QualifyFailed',
  { message: Schema.String },
) {
  override readonly [Runtime.errorExitCode] = 1
  override readonly [Runtime.errorReported] = false
}

class QualifyIncomplete extends Schema.TaggedError<QualifyIncomplete>()(
  'QualifyIncomplete',
  { message: Schema.String },
) {
  override readonly [Runtime.errorExitCode] = 2
  override readonly [Runtime.errorReported] = false
}

const failUsage = Effect.fnUntraced(function* () {
  yield* Console.error(USAGE)
  return yield* new UsageError({ message: USAGE })
})

const qualifyRun = Effect.fnUntraced(function* (options: {
  readonly gate: string | undefined
  readonly foundationOnly: boolean
}) {
  const { gate, foundationOnly } = options
  if (gate && !implementedGates.includes(gate)) {
    const message = `${gate} is not implemented as a complete gate. No passing placeholder exists.`
    yield* Console.error(message)
    return yield* new QualifyFailed({ message })
  }
  const directory = resolve(
    '.artifacts/qualification',
    `${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}`,
  )
  yield* Effect.tryPromise({
    try: () => mkdir(directory, { recursive: true }),
    catch: (error) => new QualifyFailed({ message: String(error) }),
  })
  const selected = gateProbes.filter((probe) => {
    if (gate) return probe.gate === gate
    if (foundationOnly) return probe.stage === 'foundation'
    return true
  })
  const results: Record<string, unknown> = {
    sequential: !gate,
    foundationOnly,
    gates: Object.fromEntries(implementedGates.map((id) => [id, 'not run'])),
    probes: {},
  }
  const gates = results.gates as Record<string, string>
  let failed = false
  yield* Effect.gen(function* () {
    const runStarted = yield* Effect.tryPromise({
      try: () => beginGate('tools/qualification/src/cli.ts'),
      catch: (error) => new QualifyFailed({ message: String(error) }),
    })
    results.source = runStarted
    const assertSequentialSource = Effect.fnUntraced(function* () {
      if (gate) return
      const current = yield* Effect.tryPromise({
        try: () => beginGate('tools/qualification/src/cli.ts'),
        catch: (error) => new QualifyFailed({ message: String(error) }),
      })
      yield* Effect.try({
        try: () => {
          assert.equal(
            current.dirty,
            false,
            'Full qualification requires a committed tree with no concurrent writer',
          )
          assert.notEqual(
            current.commit,
            'unknown',
            'Full qualification requires a recorded commit',
          )
          assert.equal(
            current.commit,
            runStarted.commit,
            'Revision changed during full qualification',
          )
          assert.equal(
            current.inputsSha256,
            runStarted.inputsSha256,
            'Inputs changed during full qualification',
          )
        },
        catch: (error) => new QualifyFailed({ message: String(error) }),
      })
    })
    yield* assertSequentialSource()
    for (const probe of selected) {
      yield* assertSequentialSource()
      gates[probe.gate] = 'fail: probe did not finish'
      const started = yield* Effect.tryPromise({
        try: () => beginGate(probe.path),
        catch: (error) => new QualifyFailed({ message: String(error) }),
      })
      const run = yield* Effect.tryPromise({
        try: () =>
          command(
            process.execPath,
            ['--experimental-strip-types', probe.path, ...probe.args],
            { timeout: probe.timeoutMs },
          ),
        catch: (error) => new QualifyFailed({ message: String(error) }),
      })
      yield* Effect.tryPromise({
        try: () =>
          writeFile(`${directory}/${probe.gate}.log`, run.stdout + run.stderr),
        catch: (error) => new QualifyFailed({ message: String(error) }),
      })
      const recorded = yield* Effect.tryPromise({
        try: () =>
          recordGate({
            gate: probe.gate,
            status: run.code === 0 ? 'pass' : 'fail',
            artifacts: directory,
            exitCode: run.code,
            probe: probe.path,
            started,
          }),
        catch: (error) => new QualifyFailed({ message: String(error) }),
      })
      if (run.stdout) yield* Console.log(run.stdout)
      if (run.stderr) yield* Console.error(run.stderr)
      if (recorded.status !== 'pass') {
        gates[probe.gate] =
          `fail: exit ${run.code}; see ${directory}/${probe.gate}.log`
        failed = true
        if (gate) break
        continue
      }
      gates[probe.gate] = `pass: ${probe.summary}`
    }
    yield* assertSequentialSource()
    results.sourceUnchanged = true
    const state = yield* Effect.tryPromise({
      try: () => ledgerState(implementedGates),
      catch: (error) => new QualifyFailed({ message: String(error) }),
    })
    results.ledger = state
    const passing = state.filter((entry) => entry.status === 'pass').length
    yield* Console.log(
      `\n${passing} of ${implementedGates.length} gates currently pass in the ledger.`,
    )
    if (failed) {
      return yield* new QualifyFailed({
        message: 'One or more probes failed',
      })
    }
    if (gate) return
    if (foundationOnly) {
      const foundation = state.filter((entry) =>
        foundationGates.includes(entry.gate),
      )
      const foundationPassing = foundation.filter(
        (entry) => entry.status === 'pass',
      ).length
      if (foundationPassing !== foundationGates.length) {
        const message =
          'Foundation incomplete: not every P01-P10 gate passes under the current qualification inputs.'
        yield* Console.log(message)
        return yield* new QualifyIncomplete({ message })
      }
      return
    }
    if (passing !== implementedGates.length) {
      const message =
        'Qualification incomplete: not every gate passes under the current qualification inputs.'
      yield* Console.log(message)
      return yield* new QualifyIncomplete({ message })
    }
  }).pipe(
    Effect.tapError((error) =>
      Effect.sync(() => {
        results.error = String(error)
      }),
    ),
    Effect.ensuring(
      Effect.gen(function* () {
        yield* Effect.tryPromise({
          try: () =>
            writeFile(
              `${directory}/results.json`,
              JSON.stringify(results, null, 2),
            ),
          catch: (error) => new QualifyFailed({ message: String(error) }),
        }).pipe(Effect.ignore)
        yield* Console.log(`Evidence: ${directory}`)
      }),
    ),
  )
})

const printLedger = Effect.fnUntraced(function* () {
  const state = yield* Effect.tryPromise({
    try: () => ledgerState(implementedGates),
    catch: (error) => new QualifyFailed({ message: String(error) }),
  })
  for (const row of state) {
    yield* Console.log(`${row.gate}  ${row.status.padEnd(8)}  ${row.detail}`)
  }
  yield* Console.log(
    '\nCumulative state only. Foundation closure requires one sequential full run of P01-P10. P11-P14 are follow-on.',
  )
})

const gate = Flag.String('gate').pipe(
  Flag.optional,
  Flag.withDescription('Run one implemented gate'),
)

const foundation = Flag.Boolean('foundation').pipe(
  Flag.withDefault(false),
  Flag.withDescription('Run only the P01-P10 foundation gates'),
)

const qualifyCommand = Command.make(
  'qualify',
  { gate, foundation },
  Effect.fnUntraced(function* ({ gate: selected, foundation: foundationOnly }) {
    yield* qualifyRun({
      gate: Option.getOrUndefined(selected),
      foundationOnly,
    })
  }),
).pipe(Command.withDescription('Run qualification probes and record the ledger'))

const ledgerCommand = Command.make(
  'ledger',
  {},
  printLedger,
).pipe(Command.withDescription('Print cumulative ledger state'))

export const qualification = Command.make('viviefs', {}, failUsage).pipe(
  Command.withDescription(
    'Qualify the stack with numbered gates. Ledger is machine-written.',
  ),
  Command.withSubcommands([qualifyCommand, ledgerCommand]),
)

const program = qualification.pipe(
  Command.run({ version: '0.0.0' }),
  Effect.catch((error: unknown) => {
    if (CliError.isCliError(error) && error._tag === 'UnknownSubcommand') {
      return failUsage()
    }
    if (CliError.isCliError(error) && error._tag === 'ShowHelp') {
      const unknownSubcommand = error.errors.some(
        (inner) => inner._tag === 'UnknownSubcommand',
      )
      const unusedRootHelp =
        error.errors.length === 0 && error.commandPath.length <= 1
      if (unknownSubcommand || unusedRootHelp) return failUsage()
    }
    return Effect.fail(error as never)
  }),
  Effect.provide(NodeServices.layer),
)

NodeRuntime.runMain(program)
