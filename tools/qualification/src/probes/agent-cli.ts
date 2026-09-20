import { command, type CommandResult } from '../process.ts'

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

export const agentCli = async (
  args: string[],
  options: {
    cwd: string
    env?: NodeJS.ProcessEnv
    timeout?: number
  },
): Promise<CommandResult> =>
  command('pnpm', ['exec', 'expo-agent-cli', ...args], {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
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
    env?: NodeJS.ProcessEnv
    timeout?: number
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

export const agentDevice = async (
  args: string[],
  options: {
    cwd: string
    env?: NodeJS.ProcessEnv
    timeout?: number
  },
): Promise<CommandResult> =>
  command('pnpm', ['exec', 'agent-device', ...args], {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
      CI: '1',
    },
    timeout: options.timeout ?? 60_000,
  })
