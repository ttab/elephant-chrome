import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { setSystemLanguage } from './shared/getSystemLanguage'
import { initI18n } from './src/lib/i18n'
export * from '@testing-library/react'

const TESTING_LANGUAGE = 'sv-se'

setSystemLanguage(TESTING_LANGUAGE)
await initI18n()

/**
 * Global test setup file for Vitest
 *
 * This file is automatically loaded before all test files run.
 * N.B! Use this with caution:
 * j
 * Mocks defined here with vi.mock() are hoisted and applied before
 * any component imports in test files, causing mock import issues.
 */

global.TextEncoder = TextEncoder
// @ts-expect-error unknown
global.TextDecoder = TextDecoder


const BASE_URL = import.meta.env.BASE_URL

function mockUrl(url: string): unknown {
  switch (url) {
    case `${BASE_URL}/api/envs`:
      return {
        indexUrl: 'https://example.com/index',
        webSocketUrl: 'https://example.com/websocket',
        repositoryUrl: 'https://example.com/repository',
        imageSearchUrl: 'https://example.com/image-search',
        imageSearchProvider: 'tt',
        spellcheckUrl: 'https://example.com/index',
        userUrl: 'https://example.com/user',
        faroUrl: 'https://example.com/faro',
        baboonUrl: 'https://example.com/baboon',
        systemLanguage: TESTING_LANGUAGE
      }

    // The token endpoint: what `@ttab/tt-session`'s client polls.
    case `${BASE_URL}/api/session/token`:
    case '/api/session/token':
      return {
        accessToken: 'abc123',
        expiresAt: 1718097380515,
        subject: 'core://user/5558',
        impersonating: false,
        scope: 'openid email profile'
      }

    // The identity endpoint: name, email and roles, which the token endpoint
    // deliberately never carries.
    case `${BASE_URL}/api/session/me`:
    case '/api/session/me':
      return {
        user: {
          sub: 'core://user/5558',
          name: 'Testy Test',
          email: 'testy.test@example.com',
          roles: ['ROLE_TT'],
          isAdmin: true,
          scope: 'openid email profile'
        },
        impersonating: null
      }

    default:
      throw new Error(`No mock data for ${url}`)
  }
}
global.fetch = vi.fn().mockImplementation(async (url: string) => {
  return await Promise.resolve({
    status: 200,
    ok: true,
    text: async () => await Promise.resolve(mockUrl(url)),
    json: async () => await Promise.resolve(mockUrl(url))
  })
})

vi.mock('@/contexts/SessionContext', async () => {
  const originalModule = await vi.importActual('@/contexts/SessionContext')
  const mockSession = {
    accessToken: 'abc123',
    accessTokenExpires: Date.now() + 2 * 86400 * 1000,
    user: {
      sub: 'core://user/5558',
      id: 'core://user/5558',
      name: 'Testy Test',
      email: 'testy.test@example.com',
      image: ''
    },
    units: [],
    org: '',
    roles: ['ROLE_TT'],
    isAdmin: true,
    scope: 'openid email profile',
    impersonating: null
  }
  return {
    __esModule: true,
    ...originalModule,
    useSession: vi.fn(() => {
      return {
        data: mockSession,
        status: 'authenticated',
        identityLoaded: true,
        update: vi.fn(async () => Promise.resolve({ session: mockSession, status: 'authenticated' }))
      }
    })
  }
})

vi.mock('@/shared/getCachedSession', () => ({
  getCachedSession: vi.fn(async () => Promise.resolve({ accessToken: 'abc123' })),
  clearCachedSession: vi.fn()
}))

