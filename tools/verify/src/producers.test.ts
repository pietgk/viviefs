import { describe, expect, it } from '@effect/vitest'
import { REGISTRY } from './evidence-registry.ts'
import { ownedFiles, producerProjects } from './producers.ts'

describe('coverage producers', () => {
  it('run the projects that declare their target', () => {
    expect(producerProjects('integration')).toContain('libs/workflow-engine')
    expect(producerProjects('integration')).not.toContain('libs/datom')
    expect(producerProjects('storybook')).toEqual(['features/evidence/client'])
  })

  it('cover exactly the files the registry gives them', () => {
    expect(ownedFiles('unit')).toContain('libs/datom/src/hlc.ts')
    expect(ownedFiles('unit')).not.toContain('libs/workflow-engine/src/engine.ts')
    expect(ownedFiles('integration')).toContain('libs/workflow-engine/src/engine.ts')
    const owned = new Set([...ownedFiles('unit'), ...ownedFiles('integration'), ...ownedFiles('storybook')])
    expect(REGISTRY.filter((entry) => entry.treatment === 'device').some((entry) => owned.has(entry.path))).toBe(false)
  })
})
