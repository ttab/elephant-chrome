import type { JestConfigWithTsJest } from 'ts-jest/dist/types'

const config: JestConfigWithTsJest = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
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
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/__mocks__/styleMock.js'
  },
  modulePathIgnorePatterns: [
    '<rootDir>/__tests__/data'
  ]
}
export default config
