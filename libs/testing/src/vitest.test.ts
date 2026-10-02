import { describe, expect, it } from '@effect/vitest'
import { SUITES } from './suites.ts'
import { CONFIG_FILES, COVERAGE_PRODUCERS, EXERCISE_FILES, TEST_FILES, exerciseTrackConfig, projectTestConfig } from './vitest.ts'

describe('project Vitest config', () => {
  it('gives each test file to exactly one producer by its name', () => {
    const owner = (file: string) =>
      COVERAGE_PRODUCERS.filter((producer) => {
        const { include, exclude } = TEST_FILES[producer]
        const matches = (glob: string) => new RegExp(`^${glob.replaceAll('.', '\\.').replaceAll('**/', '(.*/)?').replaceAll('*', '[^/]*')}$`).test(file)
        return include.some(matches) && !exclude.some(matches)
      })
    expect(owner('src/hlc.test.ts')).toEqual(['unit'])
    expect(owner('src/settled-text.test.tsx')).toEqual(['unit'])
    expect(owner('src/log-store-conformance.integration.test.ts')).toEqual(['integration'])
    expect(owner('src/intent-composer/IntentComposerScreen.stories.test.tsx')).toEqual(['storybook'])
  })

  it('names one config file per producer', () => {
    expect(Object.keys(CONFIG_FILES).sort()).toEqual([...COVERAGE_PRODUCERS].sort())
  })

  it('roots the config at the project and defines every suite tag', () => {
    const config = projectTestConfig('file:///repo/libs/datom/vitest.config.ts', 'integration')
    expect(config.root).toBe('/repo/libs/datom')
    expect(config.test?.include).toEqual(TEST_FILES.integration.include)
    expect(config.test?.tags?.map((tag) => tag.name)).toEqual(SUITES.map((suite) => suite.id))
  })

  it('runs each exercise test of a track, rooted at the track', () => {
    const config = exerciseTrackConfig('file:///repo/exercises/log-store/vitest.config.ts')
    expect(config.root).toBe('/repo/exercises/log-store')
    expect(config.test?.include).toEqual(EXERCISE_FILES)
  })
})
