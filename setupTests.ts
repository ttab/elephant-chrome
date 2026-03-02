import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
export * from '@testing-library/react'

/**
 * Global test setup file for Vitest
 *
 * This file is automatically loaded before all test files run.
 * N.B! Use this with caution:
 *
 * Mocks defined here with vi.mock() are hoisted and applied before
 * any component imports in test files, causing mock import issues.
 */

global.TextEncoder = TextEncoder
// @ts-expect-error unknown
global.TextDecoder = TextDecoder


const BASE_URL = import.meta.env.BASE_URL

function mockUrl(url: string): unknown {
  switch (url) {
    case `${BASE_URL}/api/urls`:
      return {
        indexUrl: 'https://example.com/index',
        webSocketUrl: 'https://example.com/websocket',
        repositoryEventsUrl: 'https://example.com/repository-events',
        repositoryUrl: 'https://example.com/repository',
        contentApiUrl: 'https://example.com/content-api',
        spellcheckUrl: 'https://example.com/index',
        userUrl: 'https://example.com/user',
        faroUrl: 'https://example.com/faro',
        baboonUrl: 'https://example.com/baboon'
      }

    case `${BASE_URL}/api/auth/session`:
    case '/api/auth/session':
      return {
        user: {
          name: 'Testy Test',
          email: 'testy.test@example.com',
          image: 'https://example.com/image.png'
        },
        expires: '2024-07-11T09:11:27.385Z',
        accessToken: 'abc123',
        accessTokenExpires: 1718097380515,
        refreshToken: '123abc',
        iat: 123,
        exp: 456,
        jti: 'abc-124'
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

vi.mock('next-auth/react', async () => {
  const originalModule = await vi.importActual('next-auth/react')
  const mockSession = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    user: { name: 'Testy Test' },
    accessToken: 'abc123'
  }
  return {
    __esModule: true,
    ...originalModule,
    useSession: vi.fn(() => {
      return { data: mockSession, status: 'authenticated' }
    }),
    getSession: vi.fn(async () => Promise.resolve(mockSession))
  }
})

