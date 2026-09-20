import { spawn } from 'node:child_process'

export interface CommandResult {
  code: number
  stdout: string
  stderr: string
}

export async function command(
  executable: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {},
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      try {
        if (process.platform !== 'win32' && child.pid)
          process.kill(-child.pid, 'SIGKILL')
        else child.kill('SIGKILL')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
      }
    }, options.timeout ?? 60_000)
    child.stdout.setEncoding('utf8').on('data', (data: string) => {
      stdout += data
    })
    child.stderr.setEncoding('utf8').on('data', (data: string) => {
      stderr += data
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({
        code: timedOut ? 124 : (code ?? 1),
        stdout,
        stderr: stderr + (timedOut ? '\nCommand timed out.' : ''),
      })
    })
  })
}

export async function checked(
  executable: string,
  args: string[],
  options: Parameters<typeof command>[2] = {},
) {
  const result = await command(executable, args, options)
  if (result.code !== 0)
    throw new Error(
      `${executable} ${args[0] ?? ''} exited ${result.code}: ${result.stderr || result.stdout}`,
    )
  return result.stdout
}
