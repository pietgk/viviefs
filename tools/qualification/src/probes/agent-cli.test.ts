import { readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from '@effect/vitest'
import {
  agentDevice,
  daemonStopProblem,
  parseJsonObject,
  withOwnAgentDeviceDaemon,
} from './agent-cli.ts'

const QUAL = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

describe('agent-cli JSON', () => {
  it('parses a lone object', () => {
    expect(parseJsonObject('{"ok":true}')).toEqual({ ok: true })
  })

  it('parses an object after a banner', () => {
    expect(parseJsonObject('progress…\n{"ready":true,"url":"http://127.0.0.1:8081"}\n')).toEqual({
      ready: true,
      url: 'http://127.0.0.1:8081',
    })
  })

  it('fails when stdout has no object', () => {
    expect(() => parseJsonObject('no json here')).toThrow(/no JSON/)
  })
})

// Shapes from agent-device 0.21.30's `daemon stop --json` on the Mac (2026-10-24).
const stopReply = (data: object, success = true) => ({
  code: 0,
  stdout: JSON.stringify({ success, data }),
  stderr: '',
})

describe('agent-device daemon stop', () => {
  it('accepts a daemon it stopped', () => {
    expect(
      daemonStopProblem(stopReply({ stopped: true, mode: 'graceful' })),
    ).toBeUndefined()
  })

  it('accepts a daemon that was already gone', () => {
    expect(
      daemonStopProblem(stopReply({ stopped: false, mode: 'not-running' })),
    ).toBeUndefined()
  })

  it('reports a daemon it left running', () => {
    expect(
      daemonStopProblem(stopReply({ stopped: false, mode: 'retained' })),
    ).toMatch(/did not stop it \(mode retained\)/)
  })

  it('reports a reply that did not succeed', () => {
    expect(
      daemonStopProblem(stopReply({ stopped: true }, false)),
    ).toMatch(/did not succeed/)
  })

  it('reports a failed or silent stop', () => {
    expect(
      daemonStopProblem({ code: 1, stdout: '', stderr: 'COMMAND_FAILED' }),
    ).toMatch(/exited 1: COMMAND_FAILED/)
    expect(
      daemonStopProblem({ code: 0, stdout: '', stderr: '' }),
    ).toMatch(/printed no JSON/)
  })
})

describe('own agent-device daemon', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const ownStateDirs = async () =>
    (await readdir(tmpdir())).filter((name) =>
      name.startsWith('viviefs-agent-device-'),
    )

  // A missing script fails in the client, before any daemon starts, so these
  // run the real CLI without a device (or an Android SDK).
  const replayMissingFlow = (stateDir: string) =>
    agentDevice(
      [
        'replay',
        `${tmpdir()}/viviefs-missing-flow.yaml`,
        '--maestro',
        '--platform',
        'ios',
        '--state-dir',
        stateDir,
        '--json',
      ],
      { cwd: QUAL },
    )

  it('returns what it ran, then stops the daemon and removes its directory', async () => {
    vi.stubEnv('ANDROID_HOME', tmpdir())
    const before = await ownStateDirs()
    const result = await withOwnAgentDeviceDaemon({ cwd: QUAL }, replayMissingFlow)
    expect(result.code).not.toBe(0)
    expect(result.stdout).toContain('replay script not found')
    expect(await ownStateDirs()).toEqual(before)
  })

  it('stops the daemon when what it ran throws', async () => {
    vi.stubEnv('ANDROID_HOME', tmpdir())
    const before = await ownStateDirs()
    await expect(
      withOwnAgentDeviceDaemon({ cwd: QUAL }, async (stateDir) => {
        await replayMissingFlow(stateDir)
        throw new Error('the probe failed')
      }),
    ).rejects.toThrow('the probe failed')
    expect(await ownStateDirs()).toEqual(before)
  })
})
