import { readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from '@effect/vitest'
import {
  agentDeviceReplay,
  parseJsonObject,
  replayDaemonStopProblem,
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

describe('replay daemon stop', () => {
  it('accepts a daemon it stopped', () => {
    expect(
      replayDaemonStopProblem(stopReply({ stopped: true, mode: 'graceful' })),
    ).toBeUndefined()
  })

  it('accepts a daemon that was already gone', () => {
    expect(
      replayDaemonStopProblem(stopReply({ stopped: false, mode: 'not-running' })),
    ).toBeUndefined()
  })

  it('reports a daemon it left running', () => {
    expect(
      replayDaemonStopProblem(stopReply({ stopped: false, mode: 'retained' })),
    ).toMatch(/did not stop it \(mode retained\)/)
  })

  it('reports a reply that did not succeed', () => {
    expect(
      replayDaemonStopProblem(stopReply({ stopped: true }, false)),
    ).toMatch(/did not succeed/)
  })

  it('reports a failed or silent stop', () => {
    expect(
      replayDaemonStopProblem({ code: 1, stdout: '', stderr: 'COMMAND_FAILED' }),
    ).toMatch(/exited 1: COMMAND_FAILED/)
    expect(
      replayDaemonStopProblem({ code: 0, stdout: '', stderr: '' }),
    ).toMatch(/printed no JSON/)
  })
})

describe('agent-device replay', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const replayStateDirs = async () =>
    (await readdir(tmpdir())).filter((name) =>
      name.startsWith('viviefs-agent-device-replay-'),
    )

  // A missing script fails in the client, before any daemon starts, so this
  // runs the real CLI without a device (or an Android SDK).
  it('stops on its own state directory and removes it, even when the replay fails', async () => {
    vi.stubEnv('ANDROID_HOME', tmpdir())
    const before = await replayStateDirs()
    const result = await agentDeviceReplay(
      [`${tmpdir()}/viviefs-missing-flow.yaml`, '--maestro', '--platform', 'ios', '--json'],
      { cwd: QUAL },
    )
    expect(result.code).not.toBe(0)
    expect(result.stdout).toContain('replay script not found')
    expect(await replayStateDirs()).toEqual(before)
  })
})
