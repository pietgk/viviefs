/**
 * Identity pattern (ADR-0022). The server verifies access tokens and knows
 * the caller; the device's sign-in session supplies them. The root carries no
 * crypto library; the `jose` verifier is `@viviefs/identity/oidc` (server
 * only). The fake issuer lives in `@viviefs/testing/identity`.
 */
export { Caller } from './caller.ts'
export { CallerStatement } from './caller-statement.ts'
export {
  AuthorizationPrompt,
  CallerStatements,
  REFRESH_MARGIN_MS,
  SignInVault,
  memorySignInVault,
  oidcSignInSession,
} from './oidc-sign-in-session.ts'
export type { AuthorizationCode } from './oidc-sign-in-session.ts'
export {
  IdentityProviderUnreachable,
  SignInFailed,
  SignInNeeded,
  SignInSession,
  SignInState,
  StatementUnavailable,
} from './sign-in-session.ts'
export {
  ACCEPTED_ALGORITHMS,
  CLOCK_TOLERANCE_SECONDS,
  ProviderAccount,
  TokenRejected,
  TokenVerifier,
  VerifiedToken,
} from './token-verifier.ts'
