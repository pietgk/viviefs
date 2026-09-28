/**
 * The P11 device lab: Keycloak on Apple Container (`keycloak.ts`) and the
 * evidence server (`apps/evidence-server/src/main.ts`) for its issuer, with
 * alice granted `acme` by her pinned id. bob signs in but is a member of
 * nothing. One issuer on every platform (Q6): the iOS simulator and web
 * reach `localhost`, the Android emulator through `adb reverse`.
 *
 * Run alone to drive a device by hand (no ledger entry):
 * `mise exec -- node --experimental-strip-types tools/qualification/src/probes/p11-lab.ts`
 * prints the passwords and serves until interrupted.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fail, freeListenPort, sleep } from './dev-client.ts'
import { reverseAndroidPorts } from './devices.ts'
import {
  ISSUER,
  KEYCLOAK_PORT,
  LAB_USERS,
  startKeycloak,
  type KeycloakLab,
} from './keycloak.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const SERVER_MAIN = join(ROOT, 'apps/evidence-server/src/main.ts')

export const SERVER_PORT = 8787
export const SERVER_URL = `http://localhost:${SERVER_PORT}/rpc`
/** The web app's origin in the lab (Expo web on Metro's port). */
export const WEB_ORIGIN = 'http://localhost:8081'

export type P11Lab = {
  readonly keycloak: KeycloakLab
  readonly serverUrl: string
  /** Android reaches the lab's `localhost` ports through the emulator. */
  readonly reverseAndroid: () => Promise<void>
  readonly stop: () => Promise<void>
}

const serverListening = async () => {
  try {
    // Any HTTP answer means the server is up; `/rpc` only accepts POST.
    await fetch(`http://127.0.0.1:${SERVER_PORT}/rpc`, {
      signal: AbortSignal.timeout(2000),
    })
    return true
  } catch {
    return false
  }
}

const startServer = async (artifacts: string): Promise<ChildProcess> => {
  await freeListenPort(SERVER_PORT)
  const seed = join(artifacts, 'evidence-server-seed.json')
  await writeFile(
    seed,
    JSON.stringify([
      { org: 'acme', account: { issuer: ISSUER, subject: LAB_USERS.alice.id } },
    ]),
  )
  const log = createWriteStream(join(artifacts, 'evidence-server.log'))
  const child = spawn(
    process.execPath,
    ['--experimental-strip-types', '--no-warnings', SERVER_MAIN],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        VIVIEFS_ISSUER: ISSUER,
        VIVIEFS_SEED: seed,
        VIVIEFS_HOST: '127.0.0.1',
        VIVIEFS_PORT: String(SERVER_PORT),
        VIVIEFS_CORS_ORIGINS: WEB_ORIGIN,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  child.stdout?.pipe(log)
  child.stderr?.pipe(log)
  const deadline = Date.now() + 60_000
  while (!(await serverListening())) {
    if (child.exitCode !== null) {
      fail(`evidence server exited ${child.exitCode} (log in ${artifacts}/evidence-server.log)`)
    }
    if (Date.now() > deadline) {
      child.kill('SIGTERM')
      fail(`evidence server did not listen on ${SERVER_PORT} within 60 s`)
    }
    await sleep(500)
  }
  return child
}

export const startP11Lab = async (artifacts: string): Promise<P11Lab> => {
  await mkdir(artifacts, { recursive: true })
  const keycloak = await startKeycloak(artifacts)
  let server: ChildProcess
  try {
    server = await startServer(artifacts)
  } catch (error) {
    await keycloak.stop()
    throw error
  }
  return {
    keycloak,
    serverUrl: SERVER_URL,
    reverseAndroid: () => reverseAndroidPorts([KEYCLOAK_PORT, SERVER_PORT]),
    stop: async () => {
      server.kill('SIGTERM')
      await keycloak.stop()
    },
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const artifacts = join(ROOT, '.artifacts/qualification/p11-lab')
  const lab = await startP11Lab(artifacts)
  console.log(`issuer ${lab.keycloak.issuer}`)
  console.log(`server ${lab.serverUrl}`)
  console.log(`alice ${lab.keycloak.password('alice')}`)
  console.log(`bob ${lab.keycloak.password('bob')}`)
  const stop = () => {
    void lab.stop().then(() => process.exit(0))
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  await new Promise(() => undefined)
}
