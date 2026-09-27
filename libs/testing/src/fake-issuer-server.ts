/**
 * Serves a fake issuer the way an OIDC provider does: a discovery document
 * and a JWKS over HTTP on 127.0.0.1. With it, `oidcTokenVerifier` runs
 * unchanged against the fake, so the code path Keycloak uses is tested
 * without a container.
 */
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import * as Effect from 'effect/Effect'
import type * as Scope from 'effect/Scope'
import { makeFakeIssuer, type FakeIssuer } from './fake-issuer.ts'

export type ServedFakeIssuer = FakeIssuer & { readonly origin: string }

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

/**
 * `discoveryIssuer` overrides the issuer the discovery document names, so a
 * test can serve a provider that lies about who it is.
 */
export const serveFakeIssuer = (options: {
  readonly audience: string
  readonly discoveryIssuer?: string
}): Effect.Effect<ServedFakeIssuer, never, Scope.Scope> =>
  Effect.gen(function* () {
    const server = yield* listen
    const { port } = server.address() as AddressInfo
    const origin = `http://127.0.0.1:${port}`
    const fake = yield* makeFakeIssuer({
      issuer: origin,
      audience: options.audience,
    })
    const discovery = JSON.stringify({
      issuer: options.discoveryIssuer ?? origin,
      jwks_uri: `${origin}/jwks`,
    })
    const jwks = JSON.stringify(fake.jwks)
    server.on('request', (request, response) => {
      const body =
        request.url === '/.well-known/openid-configuration'
          ? discovery
          : request.url === '/jwks'
            ? jwks
            : null
      response.writeHead(body === null ? 404 : 200, {
        'content-type': 'application/json',
      })
      response.end(body ?? '{}')
    })
    return { ...fake, origin }
  })
