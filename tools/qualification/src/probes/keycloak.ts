/**
 * The P11 identity-provider lab: Keycloak on Apple Container, pinned by digest
 * in `lab-images.json` (ADR-0022, D47).
 *
 * One issuer for every platform (Q6): Keycloak runs with
 * `KC_HOSTNAME=http://localhost:28080`, so the iOS simulator and web reach it
 * on localhost and the Android emulator through `adb reverse tcp:28080`.
 *
 * Two realms are generated per run with fresh passwords:
 * - `viviefs`: users alice and bob with pinned ids (so a seed can name them),
 *   realm role `member` for alice. Clients: `viviefs-mobile` (public, PKCE
 *   S256, the device sign-in), `viviefs-probe` (lab only: password grant, so
 *   the Node token contract can get tokens without a browser), and
 *   `viviefs-other-app` (password grant, no `viviefs-sync` audience).
 * - `viviefs-other`: the same kind of probe client, for tokens from a
 *   genuine but foreign issuer.
 *
 * `viviefs-mobile` and `viviefs-probe` carry the audience mapper that puts
 * `viviefs-sync` in `aud`; without it Keycloak's `aud` is not our API.
 *
 * `viviefs-mobile` access tokens live `MOBILE_ACCESS_TOKEN_SECONDS`, so a
 * device refreshes within a probe's patience and a revoked session shows up
 * as sign-in needed (check 10). A bootstrap admin with a fresh password lets
 * the probe revoke a user's sessions, as an administrator would.
 */
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { command } from '../process.ts'
import { fail, sleep } from './dev-client.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const LAB_IMAGES = join(ROOT, 'tools/qualification/lab-images.json')

export const KEYCLOAK_PORT = 28080
export const KEYCLOAK_ORIGIN = `http://localhost:${KEYCLOAK_PORT}`
export const AUDIENCE = 'viviefs-sync'
export const REALM = 'viviefs'
export const OTHER_REALM = 'viviefs-other'
export const ISSUER = `${KEYCLOAK_ORIGIN}/realms/${REALM}`
export const OTHER_ISSUER = `${KEYCLOAK_ORIGIN}/realms/${OTHER_REALM}`
export const MOBILE_CLIENT = 'viviefs-mobile'
export const MOBILE_REDIRECTS = [
  'viviefs-evidence://auth',
  'http://localhost:8081/*',
] as const

/** Short, so a device refreshes (and meets a revocation) within a probe run. */
export const MOBILE_ACCESS_TOKEN_SECONDS = 30

const CONTAINER = 'viviefs-p11-keycloak'
const ADMIN = 'viviefs-admin'
const PROBE_CLIENT = 'viviefs-probe'
const OTHER_APP_CLIENT = 'viviefs-other-app'

/** Pinned so a membership seed can name a person before anyone signs in. */
export const LAB_USERS = {
  alice: { id: 'a11ce000-0000-4000-8000-00000000a11c', roles: ['member'] },
  bob: { id: 'b0b00000-0000-4000-8000-000000000b0b', roles: [] },
} as const

export type LabUser = keyof typeof LAB_USERS

export type KeycloakLab = {
  readonly issuer: string
  readonly otherIssuer: string
  readonly password: (user: LabUser) => string
  /** A token for `user` from the `viviefs` realm, issued to the probe client. */
  readonly token: (user: LabUser) => Promise<string>
  /** A genuine token from the other realm. */
  readonly foreignIssuerToken: () => Promise<string>
  /** A genuine `viviefs` token issued for another client, without our audience. */
  readonly foreignAudienceToken: () => Promise<string>
  /**
   * Ends every session of `user` at Keycloak, offline ones included: the
   * next refresh answers `invalid_grant`.
   */
  readonly revokeSessions: (user: LabUser) => Promise<void>
  readonly stop: () => Promise<void>
}

const audienceMapper = {
  name: 'viviefs-sync-audience',
  protocol: 'openid-connect',
  protocolMapper: 'oidc-audience-mapper',
  config: {
    'included.custom.audience': AUDIENCE,
    'access.token.claim': 'true',
    'id.token.claim': 'false',
  },
}

const passwordClient = (clientId: string, withAudience: boolean) => ({
  clientId,
  enabled: true,
  publicClient: true,
  standardFlowEnabled: false,
  directAccessGrantsEnabled: true,
  protocolMappers: withAudience ? [audienceMapper] : [],
})

const realmFile = (
  realm: string,
  users: ReadonlyArray<{
    id: string
    username: string
    password: string
    roles: ReadonlyArray<string>
  }>,
  clients: ReadonlyArray<object>,
) => ({
  realm,
  enabled: true,
  sslRequired: 'none',
  registrationAllowed: false,
  accessTokenLifespan: 300,
  roles: { realm: [{ name: 'member' }] },
  clients,
  users: users.map((user) => ({
    id: user.id,
    username: user.username,
    email: `${user.username}@${realm}.test`,
    firstName: user.username,
    lastName: 'Lab',
    enabled: true,
    emailVerified: true,
    // An imported user gets only the roles listed. The realm's default roles
    // are what a newly registered user gets; they carry `offline_access`,
    // which a device needs for a refresh token that survives a restart (Q9).
    realmRoles: [`default-roles-${realm}`, ...user.roles],
    credentials: [{ type: 'password', value: user.password, temporary: false }],
  })),
})

const pinnedImage = async () => {
  const lock = JSON.parse(await readFile(LAB_IMAGES, 'utf8')) as {
    images: Record<string, { image: string }>
  }
  const image = lock.images['keycloak']?.image ?? ''
  if (!/@sha256:[0-9a-f]{64}$/.test(image)) {
    fail(`keycloak in lab-images.json is not pinned by digest: ${image}`)
  }
  return image
}

const container = (args: string[], timeout = 120_000) =>
  command('container', args, { timeout })

const removeContainer = async () => {
  await container(['stop', CONTAINER], 30_000)
  await container(['rm', CONTAINER], 30_000)
}

const discoveryReady = async (issuer: string) => {
  try {
    const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}

const passwordGrant = async (
  issuer: string,
  clientId: string,
  username: string,
  password: string,
) => {
  const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      username,
      password,
      scope: 'openid',
    }),
    signal: AbortSignal.timeout(10_000),
  })
  const body = (await response.json()) as { access_token?: string; error?: string }
  if (!response.ok || !body.access_token) {
    throw new Error(`password grant for ${username} at ${clientId} failed: ${response.status} ${JSON.stringify(body)}`)
  }
  return body.access_token as string
}

export const startKeycloak = async (artifacts: string): Promise<KeycloakLab> => {
  const status = await container(['system', 'status'], 15_000)
  if (status.code !== 0) fail(`Apple Container is not running: ${status.stderr || status.stdout}`)
  const image = await pinnedImage()

  const passwords: Record<LabUser, string> = {
    alice: randomBytes(12).toString('base64url'),
    bob: randomBytes(12).toString('base64url'),
  }
  const adminPassword = randomBytes(12).toString('base64url')
  const users = (Object.keys(LAB_USERS) as LabUser[]).map((username) => ({
    id: LAB_USERS[username].id,
    username,
    password: passwords[username],
    roles: LAB_USERS[username].roles,
  }))
  const importDir = join(artifacts, 'keycloak-import')
  await mkdir(importDir, { recursive: true })
  await writeFile(
    join(importDir, `${REALM}-realm.json`),
    JSON.stringify(
      realmFile(REALM, users, [
        {
          clientId: MOBILE_CLIENT,
          enabled: true,
          publicClient: true,
          standardFlowEnabled: true,
          directAccessGrantsEnabled: false,
          redirectUris: [...MOBILE_REDIRECTS],
          webOrigins: ['http://localhost:8081'],
          attributes: {
            'pkce.code.challenge.method': 'S256',
            'access.token.lifespan': String(MOBILE_ACCESS_TOKEN_SECONDS),
          },
          protocolMappers: [audienceMapper],
        },
        passwordClient(PROBE_CLIENT, true),
        passwordClient(OTHER_APP_CLIENT, false),
      ]),
    ),
    { mode: 0o644 },
  )
  await writeFile(
    join(importDir, `${OTHER_REALM}-realm.json`),
    JSON.stringify(
      realmFile(
        OTHER_REALM,
        [{ id: 'a11ce000-0000-4000-8000-0000000071e2', username: 'alice', password: passwords.alice, roles: [] }],
        [passwordClient(PROBE_CLIENT, true)],
      ),
    ),
    { mode: 0o644 },
  )

  await removeContainer()
  const started = await container([
    'run',
    '-d',
    '--name',
    CONTAINER,
    '-p',
    `127.0.0.1:${KEYCLOAK_PORT}:8080`,
    '-e',
    `KC_HOSTNAME=${KEYCLOAK_ORIGIN}`,
    '-e',
    'KC_HTTP_ENABLED=true',
    '-e',
    `KC_BOOTSTRAP_ADMIN_USERNAME=${ADMIN}`,
    '-e',
    `KC_BOOTSTRAP_ADMIN_PASSWORD=${adminPassword}`,
    '-v',
    `${importDir}:/opt/keycloak/data/import:ro`,
    '--memory',
    '1G',
    image,
    'start-dev',
    '--import-realm',
  ])
  if (started.code !== 0) fail(`container run ${CONTAINER} failed: ${started.stderr || started.stdout}`)

  const deadline = Date.now() + 180_000
  while (!(await discoveryReady(ISSUER)) || !(await discoveryReady(OTHER_ISSUER))) {
    if (Date.now() > deadline) {
      const logs = await container(['logs', CONTAINER], 15_000)
      await writeFile(join(artifacts, 'keycloak.log'), logs.stdout + logs.stderr)
      await removeContainer()
      throw new Error(`Keycloak did not serve both realms within 180 s (log in ${artifacts}/keycloak.log)`)
    }
    await sleep(1000)
  }

  return {
    issuer: ISSUER,
    otherIssuer: OTHER_ISSUER,
    password: (user) => passwords[user],
    token: (user) => passwordGrant(ISSUER, PROBE_CLIENT, user, passwords[user]),
    foreignIssuerToken: () =>
      passwordGrant(OTHER_ISSUER, PROBE_CLIENT, 'alice', passwords.alice),
    foreignAudienceToken: () =>
      passwordGrant(ISSUER, OTHER_APP_CLIENT, 'alice', passwords.alice),
    revokeSessions: async (user) => {
      const admin = await passwordGrant(
        `${KEYCLOAK_ORIGIN}/realms/master`,
        'admin-cli',
        ADMIN,
        adminPassword,
      )
      const base = `${KEYCLOAK_ORIGIN}/admin/realms/${REALM}/users/${LAB_USERS[user].id}`
      const call = async (method: string, path: string) => {
        const response = await fetch(`${base}${path}`, {
          method,
          headers: { authorization: `Bearer ${admin}` },
          signal: AbortSignal.timeout(10_000),
        })
        if (!response.ok && response.status !== 404) {
          throw new Error(`Keycloak admin ${method} ${path} for ${user}: ${response.status} ${await response.text()}`)
        }
      }
      // Offline sessions live under the client consent; online ones end at logout.
      await call('DELETE', `/consents/${MOBILE_CLIENT}`)
      await call('POST', '/logout')
    },
    stop: async () => {
      const logs = await container(['logs', CONTAINER], 15_000)
      await writeFile(join(artifacts, 'keycloak.log'), logs.stdout + logs.stderr)
      await removeContainer()
    },
  }
}
