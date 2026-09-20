/**
 * Composition root for the evidence mobile app. P01 installs the crypto
 * polyfill before any Effect import that hashes ids.
 */
export { default } from './app.tsx'
export { installCryptoPolyfill } from '@viviefs/platform-native'
export { runP01Checks } from './p01-effect-checks.ts'
export { publishP01 } from './p01-runtime.ts'
