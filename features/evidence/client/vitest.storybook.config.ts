import { projectTestConfig } from '@viviefs/testing/vitest'

export default projectTestConfig(import.meta.url, 'storybook', 'jsdom')
