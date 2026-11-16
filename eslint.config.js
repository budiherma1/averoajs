// ESLint 10 flat config. Replaces the old .eslintrc.cjs (airbnb-base), whose
// config package does not support flat config. The rules below keep the
// airbnb-style conventions this codebase already follows.
import js from '@eslint/js';
import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';
import { flatConfigs as importX, createNodeResolver } from 'eslint-plugin-import-x';

export default [
  {
    ignores: [
      'node_modules/**',
      'public/**', // vendored browser libraries (jquery, bootstrap, ...)
      'resources/assets/**',
      'storages/**',
      'coverage/**',
    ],
  },

  js.configs.recommended,
  importX.recommended,

  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    settings: {
      'import-x/resolver-next': [createNodeResolver()],
    },
    plugins: { '@stylistic': stylistic },
    rules: {
      // --- correctness / best practices (airbnb-base equivalents) ---
      'no-console': 'warn',
      'no-unused-vars': ['error', { args: 'none' }], // provider/strategy stubs document their parameters
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
      'no-shadow': 'error',
      'no-param-reassign': 'error',
      'no-return-await': 'off',
      'dot-notation': 'error',
      curly: ['error', 'multi-line'],
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      radix: 'error',

      // --- imports ---
      'import-x/no-unresolved': ['error', { ignore: ['^#'] }], // `#models`, `#helpers`, ... subpath imports
      'import-x/no-extraneous-dependencies': ['error', {
        devDependencies: true, optionalDependencies: false, peerDependencies: false,
      }],
      // @averoa/routes intentionally exports Router as both default and named export
      'import-x/no-named-as-default': 'off',
      'import-x/first': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/newline-after-import': 'error',

      // --- formatting (moved out of ESLint core into @stylistic) ---
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/max-len': ['error', {
        code: 100,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      }],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/arrow-spacing': 'error',
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/comma-spacing': 'error',
      '@stylistic/key-spacing': 'error',
      '@stylistic/keyword-spacing': 'error',
      '@stylistic/space-before-blocks': 'error',
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/eol-last': 'error',
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
    },
  },
];
