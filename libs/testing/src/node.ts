/**
 * `@viviefs/testing/node`: helpers that need Node built-ins. Kept out of the
 * package root because the evidence app bundles `@viviefs/testing` for its
 * on-device conformance runs, and Metro cannot resolve `node:` modules.
 */
export { TempDirectoryError, withTempDirectory } from './temp-directory.ts'
export {
  fakeAuthorizationPrompt,
  serveFakeIssuer,
  type ServedFakeIssuer,
} from './fake-issuer-server.ts'
