import { installCryptoPolyfill } from '@viviefs/platform-native'

if (process.env.EXPO_PUBLIC_CRYPTO_POLYFILL !== '0') {
  installCryptoPolyfill()
}
