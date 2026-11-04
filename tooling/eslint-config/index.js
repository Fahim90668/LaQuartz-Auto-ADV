/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: false,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    '.next',
    '.turbo',
    'coverage',
    'types.generated.ts',
  ],
};