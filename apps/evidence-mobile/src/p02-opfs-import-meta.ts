/**
 * Expo rewrites `import.meta` to `globalThis.__ExpoImportMetaRegistry`.
 * wa-sqlite reads `.url` from that object, then fetches a sibling `.wasm`
 * that Metro answers with HTML. Point those fetches at the public copy.
 */
const registry = ((globalThis as { __ExpoImportMetaRegistry?: { url?: string } })
  .__ExpoImportMetaRegistry ??= {})
if (!registry.url) {
  registry.url = self.location.href
}

const originalFetch = globalThis.fetch.bind(globalThis)
globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input instanceof Request
          ? input.url
          : String(input)
  if (url.includes('wa-sqlite') && url.includes('.wasm')) {
    return originalFetch(new URL('/wa-sqlite.wasm', self.location.origin), init)
  }
  return originalFetch(input, init)
}
