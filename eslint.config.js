import nx from '@nx/eslint-plugin'

/** D26: the clock and randomness in tests. */
const D26_TESTS = [
  {
    selector:
      'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
    message:
      'D26: Math.random is forbidden in tests. Use TestRandom.',
  },
  {
    selector:
      'CallExpression[callee.object.name="Date"][callee.property.name="now"]',
    message:
      'D26: Date.now is forbidden in tests. Use TestClock (it.effect) or Clock (it.live). Keep makeMutableClock for HlcClock.',
  },
]

/** D26: asynchrony, time and ids in domain and workflow code. */
const D26_DOMAIN = [
  {
    selector: 'FunctionDeclaration[async=true]',
    message:
      'D26: raw async is forbidden in domain and workflow code. Use Effect.',
  },
  {
    selector: 'ArrowFunctionExpression[async=true]',
    message:
      'D26: raw async is forbidden in domain and workflow code. Use Effect.',
  },
  {
    selector: 'TryStatement',
    message:
      'D26: raw try is forbidden in domain and workflow code. Use Effect.',
  },
  {
    selector:
      'CallExpression[callee.object.name="Math"][callee.property.name="random"]',
    message:
      'D26: Math.random is forbidden outside activities. Capture randomness inside an Activity.',
  },
  {
    selector:
      'CallExpression[callee.object.name="Date"][callee.property.name="now"]',
    message:
      'D26: Date.now is forbidden outside activities. Capture time inside an Activity.',
  },
  {
    selector:
      'CallExpression[callee.property.name=/^(nowUnsafe|now)$/][callee.object.name=/^(DateTime|performance)$/]',
    message:
      'D26: reading the clock is forbidden outside activities. Use Clock, or the HlcClock service.',
  },
  {
    selector:
      'CallExpression[callee.property.name=/^(randomUUID|getRandomValues)$/]',
    message:
      'D26: id generation is forbidden outside activities. Mint ids inside an Activity, or use the HlcEntropy service.',
  },
]

/**
 * D79: Schema at every boundary. Data that enters from SQL, JSON text or HTTP
 * is decoded by a Schema, never asserted; a double cast hides the same thing.
 */
const D79 = [
  {
    selector: "TaggedTemplateExpression[tag.name='sql'][typeArguments]",
    message:
      'D79: a sql<T> row type is an unchecked assertion. Decode rows with a row Schema: sql`...`.pipe(rowsOf(Row)) from @viviefs/datom.',
  },
  {
    selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse']",
    message: 'D79: JSON.parse returns unchecked data. Use Schema.fromJsonString or Schema.UnknownFromJsonString.',
  },
  {
    selector: "CallExpression[callee.property.name='json'][arguments.length=0]",
    message: 'D79: .json() on a response returns unchecked data. Use HttpClientResponse.schemaBodyJson.',
  },
  {
    selector: "TSAsExpression[expression.type='TSAsExpression'][expression.typeAnnotation.type='TSUnknownKeyword']",
    message:
      'D79: `as unknown as` asserts a type the compiler cannot check. Decode with a Schema, or give the value a typed binding; an exception names its reason in an eslint-disable comment.',
  },
]

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/coverage',
      '**/.nx',
      '**/.astro',
      '**/node_modules',
      '.agents/**',
      'repos/**',
      'vendor/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // ADR-0029: repos/ holds read-only reference subtrees; code imports
      // effect and @effect/* from pnpm.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)repos/',
              message:
                'ADR-0029: repos/ is reference only. Import effect and @effect/* from pnpm.',
            },
          ],
        },
      ],
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'kind:app',
              onlyDependOnLibsWithTags: ['kind:feature', 'kind:lib'],
            },
            {
              sourceTag: 'kind:feature',
              onlyDependOnLibsWithTags: ['kind:lib', 'kind:feature'],
            },
            {
              sourceTag: 'kind:lib',
              onlyDependOnLibsWithTags: ['kind:lib'],
            },
            {
              sourceTag: 'kind:tool',
              onlyDependOnLibsWithTags: ['*'],
            },
            {
              sourceTag: 'layer:model',
              onlyDependOnLibsWithTags: ['layer:core', 'layer:model'],
            },
            {
              sourceTag: 'layer:client',
              onlyDependOnLibsWithTags: ['layer:model', 'layer:core', 'layer:ui'],
              notDependOnLibsWithTags: ['layer:adapter'],
            },
            {
              sourceTag: 'layer:server',
              onlyDependOnLibsWithTags: ['layer:model', 'layer:core'],
              notDependOnLibsWithTags: ['layer:adapter'],
            },
            {
              sourceTag: 'layer:adapter',
              onlyDependOnLibsWithTags: ['layer:core', 'layer:adapter'],
            },
            {
              sourceTag: 'layer:ui',
              onlyDependOnLibsWithTags: ['layer:ui'],
            },
            {
              sourceTag: 'layer:testing',
              onlyDependOnLibsWithTags: ['*'],
            },
            {
              sourceTag: 'layer:core',
              onlyDependOnLibsWithTags: ['layer:core'],
            },
            {
              sourceTag: 'platform:universal',
              onlyDependOnLibsWithTags: ['platform:universal'],
            },
            {
              sourceTag: 'platform:client',
              onlyDependOnLibsWithTags: ['platform:client', 'platform:universal'],
            },
            {
              sourceTag: 'platform:server',
              onlyDependOnLibsWithTags: ['platform:server', 'platform:universal'],
            },
          ],
        },
      ],
    },
  },
  {
    // D80: a suite is test-support that ships with its contract. Suites and
    // tests may import across layers; production code may not import them.
    files: ['**/*.test.ts', '**/*.spec.ts', '**/src/suites/**/*.ts', '**/vitest*.config.ts'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
      'no-restricted-syntax': ['error', ...D26_TESTS],
    },
  },
  {
    // D79: Schema at every boundary, in production code.
    files: ['apps/**/*.ts', 'apps/**/*.tsx', 'features/**/*.ts', 'features/**/*.tsx', 'libs/**/*.ts', 'libs/**/*.tsx'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/src/suites/**', '**/vitest*.config.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...D79],
    },
  },
  {
    files: [
      'features/**/*.ts',
      'libs/datom/**/*.ts',
      'libs/workflow-engine/**/*.ts',
    ],
    ignores: [
      '**/*.test.ts',
      '**/*.spec.ts',
      // D80: suites are test-support, like tests.
      '**/src/suites/**',
      // D12/P08: XState fromPromise is the mandated Effect-to-Promise seam.
      'features/evidence/client/src/intent-composer/xstate.ts',
      // D26: the live clock and entropy Layers are the ports' only readers of
      // time and randomness; everything else takes them as services.
      'libs/datom/src/clock-live.ts',
    ],
    rules: {
      'no-restricted-syntax': ['error', ...D26_DOMAIN, ...D79],
      'no-restricted-globals': [
        'error',
        {
          name: 'Promise',
          message:
            'D26: raw Promise is forbidden in domain and workflow code. Use Effect.',
        },
      ],
    },
  },
  {
    // D80: test-support stays out of production code. Only tests, suites,
    // Vitest configs, tools/ and the evidence apps may import a suites entry
    // or @viviefs/testing.
    files: ['apps/**/*.ts', 'apps/**/*.tsx', 'features/**/*.ts', 'features/**/*.tsx', 'libs/**/*.ts', 'libs/**/*.tsx'],
    ignores: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/src/suites/**',
      '**/vitest*.config.ts',
      'apps/evidence-mobile/**',
      'apps/evidence-server/**',
      'libs/testing/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)repos/',
              message:
                'ADR-0029: repos/ is reference only. Import effect and @effect/* from pnpm.',
            },
            {
              regex: '^@viviefs/testing(/|$)|^@viviefs/[a-z-]+/suites(/|$)',
              message:
                'D80: suites and @viviefs/testing are test-support. Only tests, suites, tools/ and the evidence apps import them.',
            },
          ],
        },
      ],
    },
  },
]
