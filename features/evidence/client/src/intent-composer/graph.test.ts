import { describe, expect, it } from '@effect/vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { intentComposerMermaid } from './graph.ts'

const diagram = join(
  dirname(fileURLToPath(import.meta.url)),
  'intent-composer.mmd',
)

describe('intent composer mermaid', () => {
  it('matches the committed teaching diagram', () => {
    expect(intentComposerMermaid()).toBe(readFileSync(diagram, 'utf8'))
  })
})
