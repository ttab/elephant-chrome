import type { JestConfigWithTsJest } from 'ts-jest/dist/types'

const config: JestConfigWithTsJest = {
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: {
        ignoreCodes: [1343]
      },
      astTransformers: {
        before: [
          {
            path: 'ts-jest-mock-import-meta',
            options: {
              metaObjectReplacement: {
                env: {
                  BASE_URL: ''
                }
              }
            }
          }
        ]
      },
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/setupTests.ts'
  ],
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true
  },
  moduleDirectories: [
    '<rootDir>/node_modules',
    'node_modules'
  ],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/__mocks__/styleMock.ts',
    '@/(.*)': '<rootDir>/src/$1'
  },
  modulePathIgnorePatterns: [
    '<rootDir>/__tests__/data'
  ]
}
export default config
