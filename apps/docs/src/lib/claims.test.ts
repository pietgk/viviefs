// Reference > Claims (D93) is generated from the gate tables, the ADRs and the
// evidence notes; everything here reads a fixture repository.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from '@effect/vitest'
import {
  claimAnchor,
  claimHref,
  claimsMarkdown,
  dependentAdrs,
  evidenceNotes,
  GATE_TABLE,
  GATE_TABLE_DOC,
  parseGateClaims,
  parsePlanRows,
} from './claims.ts'

const root = mkdtempSync(join(tmpdir(), 'viviefs-docs-claims-'))
afterAll(() => rmSync(root, { recursive: true, force: true }))

const files: Record<string, string> = {
  [GATE_TABLE]: `[
  {
    gate: 'P03',
    name: 'OTLP and motel',
    claim:
      'Effect\\'s native OTLP exporter works on Hermes',
  },
  {
    gate: 'P16',
    name: 'Crypto-shredding',
    claim: 'Erased subjects are unreadable everywhere',
  },
]`,
  [GATE_TABLE_DOC]:
    "| Gate | Fact | Pass | Control | Informs |\n|---|---|---|---|---|\n| **P03** OTLP and motel | Effect's native OTLP exporter works on Hermes | A known span arrives in motel | A wrong endpoint produces no entry | D32 |\n",
  'docs/adr/0018-tracing.md': '# ADR-0018: Tracing\n\nSummary: Traces.\n\nStatus: Qualified\n\nQualifying gate: P03, P10\n',
  'docs/adr/0023-shredding.md': '# ADR-0023: Shredding\n\nSummary: Keys.\n\nStatus: Proposed\n\nQualifying gate: P15, P16\n',
  'docs/evidence/2026-09-20-p03.md': '# P03 OTLP from `Hermes`\n',
  'docs/evidence/p03-physical-device.md': '# P03 on a physical device\n',
  'docs/evidence/2026-09-26-foundation-closure.md': '# Foundation closure\n\nP01-P10 passed, P03 included.\n',
  'docs/evidence/2026-09-28-closure.md': '# Later closure\n\nOnly P11.\n',
  'docs/evidence/README.md': '# Evidence\n\nP03\n',
}
for (const [file, content] of Object.entries(files)) {
  mkdirSync(dirname(join(root, file)), { recursive: true })
  writeFileSync(join(root, file), content)
}

describe('the Claims page', () => {
  it('reads each gate claim from the gate table in code, escaped quotes included', () => {
    expect(parseGateClaims(files[GATE_TABLE] ?? '')).toEqual([
      { id: 'P03', name: 'OTLP and motel', claim: "Effect's native OTLP exporter works on Hermes" },
      { id: 'P16', name: 'Crypto-shredding', claim: 'Erased subjects are unreadable everywhere' },
    ])
  })

  it("reads pass condition and positive control from the plan's table", () => {
    expect(parsePlanRows(files[GATE_TABLE_DOC] ?? '').get('P03')).toEqual({
      passCondition: 'A known span arrives in motel',
      positiveControl: 'A wrong endpoint produces no entry',
    })
  })

  it("anchors each claim like Starlight anchors its heading", () => {
    expect(claimAnchor({ id: 'P16', name: 'Crypto-shredding' })).toBe('p16-crypto-shredding')
    expect(claimAnchor({ id: 'P01', name: 'Platform on SDK 58' })).toBe('p01-platform-on-sdk-58')
    expect(claimHref({ id: 'P07', name: 'Device resume E2E' })).toBe('/reference/claims/#p07-device-resume-e2e')
  })

  it('finds the evidence of a gate: its runs, its reviews, and the closures that name it', () => {
    expect(evidenceNotes(root, 'P03')).toEqual([
      { path: 'docs/evidence/2026-09-20-p03.md', title: 'P03 OTLP from Hermes' },
      { path: 'docs/evidence/2026-09-26-foundation-closure.md', title: 'Foundation closure' },
      { path: 'docs/evidence/p03-physical-device.md', title: 'P03 on a physical device' },
    ])
  })

  it('finds the ADRs that depend on a gate', () => {
    expect(dependentAdrs(root, 'P03')).toEqual(['ADR-0018'])
    expect(dependentAdrs(root, 'P16')).toEqual(['ADR-0023'])
  })

  it('writes one section per claim, and says when a gate has not run', () => {
    const markdown = claimsMarkdown(root)
    expect(markdown).toContain('## P03 OTLP and motel\n\n**Claim:** Effect\'s native OTLP exporter works on Hermes.')
    expect(markdown).toContain('**Proven when:** A known span arrives in motel.')
    expect(markdown).toContain('**Positive control:** A wrong endpoint produces no entry.')
    expect(markdown).toContain('**ADRs that depend on it:** ADR-0018.')
    expect(markdown).toContain('[P03 OTLP from Hermes](/reference/evidence/2026-09-20-p03/)')
    expect(markdown).toContain('## P16 Crypto-shredding')
    expect(markdown).toContain('**Proven when:** set by its grilling.')
    expect(markdown).toContain('**Evidence:** none yet: the gate has not run.')
  })
})
