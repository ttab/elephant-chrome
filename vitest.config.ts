import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '')
  const env = { ...fileEnv, ...process.env } as Record<string, string | undefined>

  return {
    test: {
      projects: [
        {
          extends: './vite.config.ts',
          test: {
            name: 'node',
            env,
            include: ['__tests__/**/*.test.ts?(x)'],
            exclude: ['__tests__/**/*.browser.test.tsx'],
            globals: true,
            setupFiles: ['./setupTests.ts'],
            environment: 'jsdom',
            deps: {
              optimizer: {
                web: {
                  include: ['date-fns']
                }
              }
            },
            server: {
              deps: {
                inline: ['@ttab/elephant-ui']
              }
            }
          }
        },
        {
          extends: './vite.config.ts',
          test: {
            name: { label: 'browser', color: 'blue' },
            include: ['__tests__/**/*.browser.test.tsx'],
            globals: true,
            browser: {
              enabled: true,
              provider: playwright(),
              headless: true,
              instances: [
                { browser: 'chromium' }
              ],
              expect: {
                toMatchScreenshot: {
                  comparatorOptions: {
                    threshold: 0.2,
                    allowedMismatchedPixelRatio: 0.01
                  }
                }
              }
            },
            deps: {
              optimizer: {
                web: {
                  include: ['date-fns']
                }
              }
            },
            server: {
              deps: {
                inline: ['@ttab/elephant-ui']
              }
            }
          }
        }
      ]
    }
  }
})
