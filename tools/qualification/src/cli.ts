import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { command } from './process.ts'
import { beginGate, ledgerState, recordGate } from './ledger.ts'
import { foundationGates, gateProbes, implementedGates } from './gates.ts'

const args = process.argv.slice(2)
const action = args.shift()
let gate: string | undefined
let foundationOnly = false
while (args.length) {
  const flag = args.shift()
  if (flag === '--') continue
  if (flag === '--gate' && args[0]) gate = args.shift()
  else if (flag === '--foundation') foundationOnly = true
  else throw new Error(`Unknown or incomplete argument: ${flag}`)
}

async function qualify() {
  if (gate && !implementedGates.includes(gate))
    throw new Error(
      `${gate} is not implemented as a complete gate. No passing placeholder exists.`,
    )
  const directory = resolve(
    '.artifacts/qualification',
    `${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}`,
  )
  await mkdir(directory, { recursive: true })
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
  try {
    const runStarted = await beginGate('tools/qualification/src/cli.ts')
    results.source = runStarted
    const assertSequentialSource = async () => {
      if (gate) return
      const current = await beginGate('tools/qualification/src/cli.ts')
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
    }
    await assertSequentialSource()
    for (const probe of selected) {
      await assertSequentialSource()
      gates[probe.gate] = 'fail: probe did not finish'
      const started = await beginGate(probe.path)
      const run = await command(
        process.execPath,
        ['--experimental-strip-types', probe.path, ...probe.args],
        { timeout: probe.timeoutMs },
      )
      await writeFile(`${directory}/${probe.gate}.log`, run.stdout + run.stderr)
      const recorded = await recordGate({
        gate: probe.gate,
        status: run.code === 0 ? 'pass' : 'fail',
        artifacts: directory,
        exitCode: run.code,
        probe: probe.path,
        started,
      })
      if (run.stdout) console.log(run.stdout)
      if (run.stderr) console.error(run.stderr)
      if (recorded.status !== 'pass') {
        gates[probe.gate] =
          `fail: exit ${run.code}; see ${directory}/${probe.gate}.log`
        failed = true
        if (gate) break
        continue
      }
      gates[probe.gate] = `pass: ${probe.summary}`
    }
    await assertSequentialSource()
    results.sourceUnchanged = true
    const state = await ledgerState(implementedGates)
    results.ledger = state
    const passing = state.filter((entry) => entry.status === 'pass').length
    console.log(
      `\n${passing} of ${implementedGates.length} gates currently pass in the ledger.`,
    )
    if (failed) {
      process.exitCode = 1
    } else if (gate) {
      process.exitCode = 0
    } else if (foundationOnly) {
      const foundation = state.filter((entry) =>
        foundationGates.includes(entry.gate),
      )
      const foundationPassing = foundation.filter(
        (entry) => entry.status === 'pass',
      ).length
      process.exitCode =
        foundationPassing === foundationGates.length ? 0 : 2
      if (process.exitCode === 2)
        console.log(
          'Foundation incomplete: not every P01-P10 gate passes under the current qualification inputs.',
        )
    } else {
      process.exitCode = passing === implementedGates.length ? 0 : 2
      if (process.exitCode === 2)
        console.log(
          'Qualification incomplete: not every gate passes under the current qualification inputs.',
        )
    }
  } catch (error) {
    results.error = String(error)
    process.exitCode = 1
    console.error(String(error))
  } finally {
    await writeFile(
      `${directory}/results.json`,
      JSON.stringify(results, null, 2),
    )
    console.log(`Evidence: ${directory}`)
  }
}

try {
  if (action === 'qualify') await qualify()
  else if (action === 'ledger') {
    const state = await ledgerState(implementedGates)
    for (const row of state)
      console.log(`${row.gate}  ${row.status.padEnd(8)}  ${row.detail}`)
    console.log(
      '\nCumulative state only. Foundation closure requires one sequential full run of P01-P10. P11-P14 are follow-on.',
    )
  } else
    throw new Error(
      `Usage: pnpm qualify [--gate Pnn | --foundation]. pnpm ledger prints cumulative state. Gates: ${implementedGates.join(', ')}.`,
    )
} catch (error) {
  console.error(String(error))
  process.exitCode = 1
}
