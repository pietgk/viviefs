import { describe, expect, it } from '@effect/vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { intentComposerTeachingDoc } from './graph.ts'

const diagram = join(
  dirname(fileURLToPath(import.meta.url)),
  'intent-composer.md',
)

describe('intent composer teaching page', () => {
  it('matches the committed teaching page', () => {
    expect(intentComposerTeachingDoc()).toBe(readFileSync(diagram, 'utf8'))
  })
})
