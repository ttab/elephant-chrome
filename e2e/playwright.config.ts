import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({
  path: path.resolve(import.meta.dirname, '.env.e2e'),
  quiet: true
})

export default defineConfig({
  grepInvert: /@experimental/,
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: './playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
    ...(process.env.E2E_COVERAGE
      ? [['./reporters/coverage-reporter.ts'] as const]
      : [])
  ],
  outputDir: './test-results',
  use: {
    baseURL: (process.env.E2E_BASE_URL || 'http://localhost:5183/elephant')
      .replace(/\/?$/, '/'),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined
    }
  },
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
