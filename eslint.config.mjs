import { includeIgnoreFile } from '@eslint/compat'
import path from 'node:path'
import elephant from '@ttab/eslint-config-elephant'

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
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
