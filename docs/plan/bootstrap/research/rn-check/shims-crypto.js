// Stand-in for a crypto polyfill (e.g. expo-crypto / react-native-quick-crypto). NOT cryptographically secure - test only.
globalThis.crypto ??= {}
globalThis.crypto.getRandomValues ??= (a) => { for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 256) | 0; return a }
globalThis.crypto.subtle ??= { digest: async (_alg, data) => { const out = new Uint8Array(32); new Uint8Array(data.buffer ?? data).forEach((b, i) => { out[i % 32] ^= b + i }); return out.buffer } }
