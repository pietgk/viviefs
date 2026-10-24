import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
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

// These start real daemons with the CLI and no device: `session list` brings
// one up on the state directory it is given.
describe('own agent-device daemon', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const startDaemon = async (stateDir: string) => {
    const listed = await agentDevice(
      ['session', 'list', '--state-dir', stateDir, '--json'],
      { cwd: QUAL },
    )
    expect(listed.code).toBe(0)
    const record = JSON.parse(await readFile(`${stateDir}/daemon.json`, 'utf8'))
    expect(isAlive(record.pid)).toBe(true)
    return record as { pid: number }
  }

  const isAlive = (pid: number) => {
    try {
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  }

  it('stops the daemon it started and removes its directory', async () => {
    vi.stubEnv('ANDROID_HOME', tmpdir())
    let stateDir = ''
    const daemon = await withOwnAgentDeviceDaemon({ cwd: QUAL }, async (dir) => {
      stateDir = dir
      return startDaemon(dir)
    })
    expect(isAlive(daemon.pid)).toBe(false)
    expect(existsSync(stateDir)).toBe(false)
  })

  it('stops the daemon when what it ran throws', async () => {
    vi.stubEnv('ANDROID_HOME', tmpdir())
    let stateDir = ''
    let pid = 0
    await expect(
      withOwnAgentDeviceDaemon({ cwd: QUAL }, async (dir) => {
        stateDir = dir
        pid = (await startDaemon(dir)).pid
        throw new Error('the probe failed')
      }),
    ).rejects.toThrow('the probe failed')
    expect(isAlive(pid)).toBe(false)
    expect(existsSync(stateDir)).toBe(false)
  })

  // A record whose pid now belongs to another process, with a start time that
  // process cannot have: agent-device reads it as stale and signals nothing.
  it('never signals a process the record names but that is not the daemon', async () => {
    vi.stubEnv('ANDROID_HOME', tmpdir())
    const other = spawn('sleep', ['60'], { stdio: 'ignore' })
    let stateDir = ''
    try {
      await withOwnAgentDeviceDaemon({ cwd: QUAL }, async (dir) => {
        stateDir = dir
        const record = await startDaemon(dir)
        const stopped = await agentDevice(
          ['daemon', 'stop', '--state-dir', dir, '--json'],
          { cwd: QUAL },
        )
        expect(daemonStopProblem(stopped)).toBeUndefined()
        await writeFile(
          `${dir}/daemon.json`,
          JSON.stringify({
            ...record,
            pid: other.pid,
            processStartTime: 'Thu Jan  1 00:00:00 2026',
          }),
        )
      })
      expect(isAlive(other.pid ?? 0)).toBe(true)
      expect(existsSync(stateDir)).toBe(false)
    } finally {
      other.kill()
    }
  })

  it('fails and keeps the directory when the stop cannot tell', async () => {
    vi.stubEnv('ANDROID_HOME', tmpdir())
    let stateDir = ''
    try {
      await expect(
        withOwnAgentDeviceDaemon({ cwd: QUAL }, async (dir) => {
          stateDir = dir
          await startDaemon(dir)
          const stopped = await agentDevice(
            ['daemon', 'stop', '--state-dir', dir, '--json'],
            { cwd: QUAL },
          )
          expect(daemonStopProblem(stopped)).toBeUndefined()
          await writeFile(`${dir}/daemon.json`, 'not json')
        }),
      ).rejects.toThrow(/agent-device daemon in .*daemon stop exited 1/s)
      expect(existsSync(stateDir)).toBe(true)
    } finally {
      if (stateDir) await rm(stateDir, { recursive: true, force: true })
    }
  })
})
