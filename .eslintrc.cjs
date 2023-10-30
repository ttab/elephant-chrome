module.exports = {
  settings: {
    react: {
      version: 'detect'
    }
  },
  root: true,
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'standard-with-typescript'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    "space-before-function-paren": ["warn", "never"],
    "@typescript-eslint/space-before-function-paren": ["warn", "never"],
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    "@typescript-eslint/strict-boolean-expressions": "off",
    "no-multiple-empty-lines": ["warn", { max: 2, maxEOF: 1 }],
    "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }]
  },
}
