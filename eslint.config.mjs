import nx from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  importPlugin.flatConfigs.recommended,
  {
    ignores: ['**/dist', '**/out-tsc', '**/.angular', '**/coverage'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: [
            './tsconfig.base.json',
            './apps/**/tsconfig.json',
            './libs/**/tsconfig.json',
          ],
        },
      },
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {
      'import/no-unresolved': ['warn'],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],

          pathGroups: [
            {
              pattern: '@nestjs/**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@angular/**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@steam-idler/infra',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@steam-idler/{server,client}/infra/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@steam-idler/**',
              group: 'internal',
              position: 'after',
            },
          ],

          pathGroupsExcludedImportTypes: ['builtin'],

          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },

          'newlines-between': 'always',
        },
      ],
    },
  },
];
