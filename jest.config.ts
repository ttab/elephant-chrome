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
  ],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!@ttab/elephant-ui)'
  ]
}
export default config
