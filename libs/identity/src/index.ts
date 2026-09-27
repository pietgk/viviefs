/**
 * Identity pattern (ADR-0022). The server verifies access tokens and knows
 * the caller. The device's sign-in session arrives with the device steps of
 * P11. The fake issuer lives in `@viviefs/testing`.
 */
export { Caller } from './caller.ts'
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
