/**
 * `@viviefs/testing/node`: helpers that need Node built-ins. Kept out of the
 * package root because the evidence app bundles suites that use
 * `@viviefs/testing`, and Metro cannot resolve `node:` modules.
 */
export { TempDirectoryError, withTempDirectory } from './temp-directory.ts'
