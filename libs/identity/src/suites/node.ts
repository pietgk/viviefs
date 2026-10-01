/**
 * `@viviefs/identity/suites/node`: the fake issuer served over HTTP. Kept out
 * of `@viviefs/identity/suites` because Metro cannot resolve `node:` modules.
 */
export {
  fakeAuthorizationPrompt,
  serveFakeIssuer,
  type ServedFakeIssuer,
} from './fake-issuer-server.ts'
