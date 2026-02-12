import elephant from '@ttab/eslint-config-elephant'

export default [
  {
    ignores: ['public/lib/**']
  },
  ...elephant,
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
