/**
 * `@viviefs/testing/identity`: the fake issuer and the token contract suite.
 * Kept out of the package root so the evidence app's bundle does not carry
 * `jose` for its on-device conformance runs.
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
} from './token-verifier-conformance.ts'
