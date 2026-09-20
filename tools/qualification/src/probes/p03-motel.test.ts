import { describe, expect, it } from '@effect/vitest'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')

describe('P03 motel pin', () => {
  it('pins motel 0.2.8 with Effect beta.90 overrides', async () => {
    const vendor = await readFile(
      resolve(ROOT, 'vendor/motel/package.json'),
      'utf8',
    )
    expect(vendor).toContain('"@kitlangton/motel": "0.2.8"')
    expect(vendor).toContain('"effect": "4.0.0-beta.90"')
    expect(vendor).toContain('"@effect/platform-node-shared": "4.0.0-beta.90"')
  })

  it('documents LAN binding and cursor catch-up', async () => {
    const doc = await readFile(
      resolve(ROOT, 'docs/evidence/p03-physical-device.md'),
      'utf8',
    )
    expect(doc).toMatch(/LAN binding/i)
    expect(doc).toMatch(/cursor catch-up/i)
    expect(doc).toContain('MOTEL_OTEL_HOST=0.0.0.0')
  })
})
