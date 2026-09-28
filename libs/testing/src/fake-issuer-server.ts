/**
 * Serves a fake issuer the way an OIDC provider does: a discovery document,
 * a JWKS, a token endpoint and a revocation endpoint over HTTP on 127.0.0.1.
 * With it, `oidcTokenVerifier` and `oidcSignInSession` run unchanged against
 * the fake, so the code paths Keycloak uses are tested without a container.
 *
 * The token endpoint implements what a device sign-in needs: the
 * authorization code grant with a PKCE (S256) check, and refresh tokens that
 * rotate on every use and answer `invalid_grant` once revoked. The login
 * page itself is not served: a test issues a code with `issueCode`, as if a
 * person had signed in, and `fakeAuthorizationPrompt` does that for a
 * sign-in session.
 */
import { createHash, randomBytes } from 'node:crypto'
import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import type * as Scope from 'effect/Scope'
import { AuthorizationPrompt, SignInFailed } from '@viviefs/identity'
import { makeFakeIssuer, type FakeIssuer } from './fake-issuer.ts'

export type ServedFakeIssuer = FakeIssuer & {
  readonly origin: string
  /** A code for `subject`, as the login page would redirect back with. */
  readonly issueCode: (grant: {
    readonly subject: string
    readonly clientId: string
    readonly redirectUri: string
    readonly codeChallenge: string
  }) => string
  /** Every refresh token of `subject` now answers `invalid_grant`. */
  readonly revokeRefreshTokens: (subject: string) => void
  /** While unavailable the token endpoint answers 503. */
  readonly setAvailable: (available: boolean) => void
  /** Refresh tokens the fake still honours, per subject. */
  readonly liveRefreshTokens: (subject: string) => number
  /** The `grant_type` of every token request answered 200, in order. */
  readonly grants: () => ReadonlyArray<string>
  /** Whether any request carried trace context (`traceparent`, `b3`). */
  readonly sawTraceContext: () => boolean
}

const listen = Effect.acquireRelease(
  Effect.callback<Server>((resume) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => resume(Effect.succeed(server)))
  }),
  (server) =>
    Effect.callback<void>((resume) => {
      server.close(() => resume(Effect.void))
      server.closeAllConnections()
    }),
)

const readForm = (request: IncomingMessage) =>
  new Promise<URLSearchParams>((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk: string) => {
      body += chunk
    })
    request.on('end', () => resolve(new URLSearchParams(body)))
    request.on('error', reject)
  })

const s256 = (verifier: string) =>
  createHash('sha256').update(verifier).digest('base64url')

const opaque = () => randomBytes(24).toString('base64url')

/**
 * `discoveryIssuer` overrides the issuer the discovery document names, so a
 * test can serve a provider that lies about who it is.
 */
export const serveFakeIssuer = (options: {
  readonly audience: string
  readonly discoveryIssuer?: string
  readonly accessTokenLifetimeMs?: number
}): Effect.Effect<ServedFakeIssuer, never, Scope.Scope> =>
  Effect.gen(function* () {
    const server = yield* listen
    const { port } = server.address() as AddressInfo
    const origin = `http://127.0.0.1:${port}`
    const fake = yield* makeFakeIssuer({
      issuer: origin,
      audience: options.audience,
    })
    const lifetimeMs = options.accessTokenLifetimeMs ?? 5 * 60 * 1000
    const discovery = JSON.stringify({
      issuer: options.discoveryIssuer ?? origin,
      jwks_uri: `${origin}/jwks`,
      authorization_endpoint: `${origin}/authorize`,
      token_endpoint: `${origin}/token`,
      revocation_endpoint: `${origin}/revoke`,
    })
    const jwks = JSON.stringify(fake.jwks)

    type Code = {
      readonly subject: string
      readonly clientId: string
      readonly redirectUri: string
      readonly codeChallenge: string
    }
    const codes = new Map<string, Code>()
    const refreshTokens = new Map<
      string,
      { readonly subject: string; readonly clientId: string }
    >()
    let available = true
    const granted: Array<string> = []

    const tokensFor = (subject: string, clientId: string) =>
      Effect.runPromise(fake.sign({ subject, lifetimeMs })).then((access) => {
        const refresh = opaque()
        refreshTokens.set(refresh, { subject, clientId })
        return {
          access_token: access,
          token_type: 'Bearer',
          expires_in: Math.floor(lifetimeMs / 1000),
          refresh_token: refresh,
        }
      })

    const token = async (form: URLSearchParams) => {
      const clientId = form.get('client_id') ?? ''
      const grant = form.get('grant_type')
      if (grant === 'authorization_code') {
        const code = codes.get(form.get('code') ?? '')
        codes.delete(form.get('code') ?? '')
        const verifier = form.get('code_verifier') ?? ''
        if (
          code === undefined ||
          code.clientId !== clientId ||
          code.redirectUri !== form.get('redirect_uri') ||
          s256(verifier) !== code.codeChallenge
        ) {
          return { status: 400, body: { error: 'invalid_grant' } }
        }
        return { status: 200, body: await tokensFor(code.subject, clientId) }
      }
      if (grant === 'refresh_token') {
        const presented = form.get('refresh_token') ?? ''
        const held = refreshTokens.get(presented)
        if (held === undefined || held.clientId !== clientId) {
          return { status: 400, body: { error: 'invalid_grant' } }
        }
        refreshTokens.delete(presented)
        return { status: 200, body: await tokensFor(held.subject, clientId) }
      }
      return { status: 400, body: { error: 'unsupported_grant_type' } }
    }

    let traced = false
    server.on('request', (request, response) => {
      if ('traceparent' in request.headers || 'b3' in request.headers) {
        traced = true
      }
      const reply = (status: number, body: string) => {
        response.writeHead(status, { 'content-type': 'application/json' })
        response.end(body)
      }
      if (request.method === 'POST' && request.url === '/token') {
        if (!available) return reply(503, '{}')
        void readForm(request)
          .then(async (form) => {
            const answer = await token(form)
            if (answer.status === 200) granted.push(form.get('grant_type') ?? '')
            return answer
          })
          .then(
            (answer) => reply(answer.status, JSON.stringify(answer.body)),
            (error: unknown) => reply(500, JSON.stringify({ error: String(error) })),
          )
        return
      }
      if (request.method === 'POST' && request.url === '/revoke') {
        void readForm(request).then((form) => {
          refreshTokens.delete(form.get('token') ?? '')
          reply(200, '{}')
        })
        return
      }
      const body =
        request.url === '/.well-known/openid-configuration'
          ? discovery
          : request.url === '/jwks'
            ? jwks
            : null
      reply(body === null ? 404 : 200, body ?? '{}')
    })

    return {
      ...fake,
      origin,
      issueCode: (grant) => {
        const code = opaque()
        codes.set(code, grant)
        return code
      },
      revokeRefreshTokens: (subject) => {
        for (const [refresh, held] of refreshTokens) {
          if (held.subject === subject) refreshTokens.delete(refresh)
        }
      },
      setAvailable: (next) => {
        available = next
      },
      liveRefreshTokens: (subject) =>
        [...refreshTokens.values()].filter((held) => held.subject === subject)
          .length,
      grants: () => [...granted],
      sawTraceContext: () => traced,
    }
  })

/**
 * The interactive step of a sign-in at the served fake: `subject()` names who
 * signs in (a person typing their password), and the prompt returns the code
 * the fake issues for a fresh PKCE verifier. `subject()` returning null is a
 * person cancelling the login page.
 */
export const fakeAuthorizationPrompt = (
  fake: ServedFakeIssuer,
  subject: () => string | null,
  redirectUri = 'viviefs-test://auth',
): Layer.Layer<AuthorizationPrompt> =>
  Layer.succeed(
    AuthorizationPrompt,
    AuthorizationPrompt.of({
      authorize: (request) =>
        Effect.gen(function* () {
          const who = subject()
          if (who === null) {
            return yield* new SignInFailed({ reason: 'cancel' })
          }
          const codeVerifier = opaque()
          const code = fake.issueCode({
            subject: who,
            clientId: request.clientId,
            redirectUri,
            codeChallenge: s256(codeVerifier),
          })
          return { code, codeVerifier, redirectUri }
        }),
    }),
  )
