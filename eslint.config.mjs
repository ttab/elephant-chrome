import elephant from '@ttab/eslint-config-elephant'

export default [
  ...elephant,
  {
    ignores: ['e2e/playwright-report/']
  },
  {
    rules: {
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1,
        offsetTernaryExpressions: true,
        offsetTernaryExpressionsOffsetCallExpressions: false
      }]
    }
  }
]
