import nx from '@nx/eslint-plugin'

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
      '**/node_modules',
      '.agents/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
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
    files: [
      'features/**/*.ts',
      'libs/datom/**/*.ts',
      'libs/workflow-engine/**/*.ts',
    ],
    ignores: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
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
      ],
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
]
