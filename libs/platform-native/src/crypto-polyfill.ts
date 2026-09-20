/**
 * Hermes has neither `crypto.getRandomValues` nor `crypto.subtle.digest`.
 * Effect Workflow hashes execution ids with SHA-256; UUID constructors need
 * CSPRNG. This is the P01 exemplar: expo-crypto installed onto `globalThis.crypto`.
 */
import * as ExpoCrypto from 'expo-crypto'

type Bytes = ArrayBuffer | ArrayBufferView

type DigestAlgorithm = string | { name: string }

type CryptoShim = {
  getRandomValues: (array: ArrayBufferView) => ArrayBufferView
  subtle: {
    digest: (algorithm: DigestAlgorithm, data: Bytes) => Promise<ArrayBuffer>
  }
}

const toBytes = (data: Bytes): Uint8Array => {
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
}

const algorithmName = (algorithm: DigestAlgorithm): string => {
  if (typeof algorithm === 'string') return algorithm
  return algorithm.name
}

const cryptoRoot = globalThis as unknown as {
  crypto?: Partial<CryptoShim>
}

export const installCryptoPolyfill = (): void => {
  const crypto = (cryptoRoot.crypto ??= {} as CryptoShim)
  if (typeof crypto.getRandomValues !== 'function') {
    crypto.getRandomValues = (array: ArrayBufferView) =>
      ExpoCrypto.getRandomValues(array as never)
  }
  const subtle = (crypto.subtle ??= {} as CryptoShim['subtle'])
  if (typeof subtle.digest !== 'function') {
    subtle.digest = (algorithm, data) => {
      const name = algorithmName(algorithm).toUpperCase()
      if (name !== 'SHA-256' && name !== 'SHA256') {
        return Promise.reject(
          new Error(
            `crypto.subtle.digest polyfill implements SHA-256 only, got ${name}`,
          ),
        )
      }
      return ExpoCrypto.digest(
        ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        toBytes(data),
      )
    }
  }
}
