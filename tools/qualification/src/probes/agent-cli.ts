import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { command, type CommandResult } from '../process.ts'
import { androidSdkPath } from './devices.ts'

export type AgentCliJson = {
  code: number
  stdout: string
  stderr: string
  data: unknown
}

export const parseJsonObject = (stdout: string): unknown => {
  const trimmed = stdout.trim()
  if (!trimmed) throw new Error('agent-cli printed no JSON')
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start < 0 || end <= start) {
      throw new Error(`agent-cli printed no JSON object:\n${trimmed.slice(-2000)}`)
    }
    return JSON.parse(trimmed.slice(start, end + 1))
  }
}

// Like agentDevice below: every call carries the Android SDK, so an Android
// command from an iOS leg finds adb (runtime:stop --android failed with
// ADB_NOT_RUNNABLE until 2026-09-29).
export const agentCli = async (
  args: string[],
  options: {
    cwd: string
    env?: NodeJS.ProcessEnv | undefined
    timeout?: number | undefined
  },
): Promise<CommandResult> =>
  command('pnpm', ['exec', 'expo-agent-cli', ...args], {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
      PATH: androidSdkPath({ ...process.env, ...options.env }.PATH),
      CI: '1',
      EXPO_NO_TELEMETRY: '1',
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1',
      NODE_OPTIONS: [
        process.env.NODE_OPTIONS,
        options.env?.NODE_OPTIONS,
        '--dns-result-order=ipv4first',
      ]
        .filter(Boolean)
        .join(' '),
    },
    timeout: options.timeout,
  })

export const agentCliJson = async (
  args: string[],
  options: {
    cwd: string
    env?: NodeJS.ProcessEnv | undefined
    timeout?: number | undefined
  },
): Promise<AgentCliJson> => {
  const result = await agentCli(args, options)
  try {
    return { ...result, data: parseJsonObject(result.stdout) }
  } catch (error) {
    if (result.code !== 0) return { ...result, data: undefined }
    throw new Error(
      `expo-agent-cli ${args.join(' ')} exited ${result.code}: ${String(error)}\n${result.stderr || result.stdout}`,
      { cause: error },
    )
  }
}

/**
 * The first agent-device call starts a daemon that keeps its PATH for later
 * calls, whichever platform they drive. Every call therefore carries the
 * Android SDK, so an iOS call that starts the daemon does not leave Android
 * calls without `adb` (P07 on 2026-09-28).
 */
export const agentDevice = async (
  args: string[],
  options: {
    cwd: string
    env?: NodeJS.ProcessEnv | undefined
    timeout?: number | undefined
  },
): Promise<CommandResult> => {
  const env = { ...process.env, ...options.env }
  return command('pnpm', ['exec', 'agent-device', ...args], {
    cwd: options.cwd,
    env: {
      ...env,
      PATH: androidSdkPath(env.PATH),
      CI: '1',
    },
    timeout: options.timeout ?? 60_000,
  })
}

/**
 * Why `daemon stop` did not account for a replay daemon, or `undefined` when
 * it stopped it or found none running (the replay may have retired it).
 */
export const replayDaemonStopProblem = (
  result: CommandResult,
): string | undefined => {
  const output = (result.stderr || result.stdout).trim().slice(-2000)
  if (result.code !== 0) return `daemon stop exited ${result.code}: ${output}`
  let parsed: unknown
  try {
    parsed = parseJsonObject(result.stdout)
  } catch (error) {
    return `daemon stop printed no JSON: ${String(error)}`
  }
  const { success, data } = parsed as {
    success?: unknown
    data?: { stopped?: unknown; mode?: unknown }
  }
  if (success !== true) return `daemon stop did not succeed: ${output}`
  if (data?.stopped === true || data?.mode === 'not-running') return undefined
  return `daemon stop did not stop it (mode ${String(data?.mode)})`
}

const stopReplayDaemon = async (
  stateDir: string,
  options: { cwd: string; env?: NodeJS.ProcessEnv | undefined },
) => {
  const stopped = await agentDevice(
    ['daemon', 'stop', '--state-dir', stateDir, '--json'],
    { cwd: options.cwd, env: options.env, timeout: 30_000 },
  )
  const problem = replayDaemonStopProblem(stopped)
  // The directory holds the daemon's log; it stays when the daemon may too.
  if (problem) {
    throw new Error(`agent-device replay daemon in ${stateDir}: ${problem}`)
  }
  await rm(stateDir, { recursive: true, force: true })
}

/**
 * `replay` of a script that leaves its session active (every P07 flow) keeps
 * the daemon it started, in a temporary state directory that no later call
 * names, so `close` never reaches it (I76). Each replay therefore runs on a
 * state directory of its own, and its daemon is stopped there afterwards,
 * whatever the replay did. The default daemon is never touched.
 */
export const agentDeviceReplay = async (
  args: string[],
  options: {
    cwd: string
    env?: NodeJS.ProcessEnv | undefined
    timeout?: number | undefined
  },
): Promise<CommandResult> => {
  const stateDir = await mkdtemp(join(tmpdir(), 'viviefs-agent-device-replay-'))
  try {
    return await agentDevice(['replay', ...args, '--state-dir', stateDir], options)
  } finally {
    await stopReplayDaemon(stateDir, options)
  }
}
