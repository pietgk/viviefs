import { describe, expect, it } from '@effect/vitest'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')

const indexPlanUsesEavt = (plan: unknown): boolean => {
  const text = JSON.stringify(plan).toLowerCase()
  return (
    text.includes('idx_probe_datoms_eavt') || /using (covering )?index/.test(text)
  )
}

describe('P02 SQL driver checks', () => {
  it('pins op-sqlite 18.2.5 in the workspace override', async () => {
    const workspace = await readFile(resolve(ROOT, 'pnpm-workspace.yaml'), 'utf8')
    expect(workspace).toMatch(/@op-engineering\/op-sqlite['"]?\s*:\s*['"]?18\.2\.5/)
  })

  it('treats an EAVT index plan as a pass', () => {
    expect(
      indexPlanUsesEavt([
        {
          detail:
            'SEARCH probe_datoms USING INDEX idx_probe_datoms_eavt (e=? AND a=?)',
        },
      ]),
    ).toBe(true)
    expect(indexPlanUsesEavt([{ detail: 'SCAN probe_datoms' }])).toBe(false)
  })
})
