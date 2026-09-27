/**
 * Identity pattern (ADR-0022). The server verifies access tokens and knows
 * the caller; the device's sign-in session supplies them. The fake issuer
 * lives in `@viviefs/testing/identity`.
 */
export { Caller } from './caller.ts'
export { SignInNeeded, SignInSession } from './sign-in-session.ts'
export {
  ACCEPTED_ALGORITHMS,
  CLOCK_TOLERANCE_SECONDS,
  DiscoveryFailed,
  ProviderAccount,
  TokenRejected,
  TokenVerifier,
  VerifiedToken,
  makeTokenVerifier,
  oidcTokenVerifier,
} from './token-verifier.ts'
