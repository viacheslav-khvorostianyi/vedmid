import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dist-demo',
      'coverage',
      'playwright-report',
      'test-results',
      'src/legacy',
      'supabase/functions/*/index.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name='sort'] > ArrowFunctionExpression > BinaryExpression[left.callee.object.name='Math'][left.callee.property.name='random']",
          message:
            'Use shuffle() from @/lib/shuffle (Fisher–Yates) instead of sort(() => Math.random() - 0.5).',
        },
      ],
    },
  },
  {
    // App code must not import the legacy seed data or the legacy prototype.
    files: ['src/**/*.{ts,tsx}'],
    // Tests may build fixtures from the real seed data.
    ignores: ['src/data/**', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/data/*', '**/data/*'], message: 'src/data is the Supabase seed source only.' },
            {
              group: ['@/legacy/*', '**/legacy/*'],
              message: 'src/legacy is reference code, excluded from the build.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['e2e/**/*.ts', 'supabase/**/*.ts', 'scripts/**/*.mjs', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
    // Playwright fixtures call `use()`, which is not React's hook.
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
);
