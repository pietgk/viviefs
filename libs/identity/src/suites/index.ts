/**
 * `@viviefs/identity/suites`: the `identity/token-verifier` suite and the fake
 * issuer it runs against (D80). Test-support: only tests, other suites,
 * `tools/` and the evidence apps may import it. The Node-only server that
 * serves the fake issuer over HTTP is `@viviefs/identity/suites/node`.
 */
export {
  FAKE_TOKEN_LIFETIME_MS,
  fakeSignInSession,
  makeFakeIssuer,
  tokenSignInSession,
  type FakeIssuer,
} from './fake-issuer.ts'
export {
  TOKEN_CHECK_COUNT,
  TOKEN_CHECK_NAMES,
  runTokenVerifierChecks,
  type TokenSource,
} from './token-verifier.ts'
