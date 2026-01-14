import '@testing-library/jest-dom'
import { initializeNavigationState } from '@/navigation/lib'
import { randomUUID } from 'node:crypto'
import { TextEncoder, TextDecoder } from 'util'
import { type Mock, vi } from 'vitest'
import { type Dispatch } from 'react'
import { useNavigation, useView, useRegistry } from './src/hooks'
import { type NavigationActionType } from './src/types'
export * from '@testing-library/react'
import { sv } from 'date-fns/locale'
import { DEFAULT_TIMEZONE } from '@/defaults/defaultTimezone'

/**
 * Global test setup file for Vitest
 *
 * This file is automatically loaded before all test files run.
 * Use this file for:
 * - Global mocks that need to be hoisted (imported before components)
 * - Environment setup (crypto, TextEncoder, fetch mocks)
 * - Default mock return values for frequently used hooks
 *
 * Note: Mocks defined here with vi.mock() are hoisted and applied before
 * any component imports in test files, solving mock timing issues.
 */

// Set up crypto mock FIRST before any other imports
window.crypto.randomUUID = randomUUID

// Use Object.defineProperty to override the crypto global
Object.defineProperty(global, 'crypto', {
  value: { randomUUID },
  writable: true,
  configurable: true
})

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

vi.mock('@/hooks/useView', () => ({
  useView: vi.fn()
}));

(useView as Mock).mockReturnValue({
  viewId: 'eddbfe39-57d4-4b32-b9a1-a555e39139ea'
})

vi.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: vi.fn()
}))
const mockState = initializeNavigationState()

history.pushState({
  viewId: 'eddbfe39-57d4-4b32-b9a1-a555e39139ea',
  contentState: [
    {
      viewId: 'eddbfe39-57d4-4b32-b9a1-a555e39139ea',
      name: 'Plannings',
      props: {},
      path: '/'
    }
  ]
}, '', '/')

const mockDispatch = vi.fn() as Dispatch<NavigationActionType>


(useNavigation as Mock).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
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

vi.mock('@/hooks/useAuthors', () => ({
  useAuthors: () => [
    { id: '123', name: 'Alice Johnson', firstName: 'Alice', lastName: 'Johnson', initials: 'AAJ', email: 'aj@example.com', sub: 'core://user/0001' },
    { id: '234', name: 'Bob Lee', firstName: 'Bob', lastName: 'Lee', email: 'bl@example.com', sub: 'core://user/0002' },
    { id: '345', name: 'Christine King', firstName: 'Christine', lastName: 'King', initials: 'CK', email: 'ck@example.com', sub: 'core://user/0003' }
  ]
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: vi.fn()
}));

(useRegistry as Mock).mockReturnValue({
  repository: {
    saveDocument: vi.fn(),
    getMeta: vi.fn(),
    getDocument: vi.fn()
  },
  locale: {
    code: {
      full: 'sv-SE',
      short: 'sv',
      long: 'sv'
    },
    module: sv
  },
  timeZone: DEFAULT_TIMEZONE,
  server: {},
  dispatch: {},
  index: {
    query: vi.fn().mockReturnValue({
      ok: true,
      hits: []
    })
  }
})

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
    custom: vi.fn(),
    message: vi.fn(),
    dismiss: vi.fn()
  },
  Toaster: vi.fn(() => null)
}))
