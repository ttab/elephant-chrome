import '@testing-library/jest-dom'

import { randomUUID } from 'node:crypto'
import { TextEncoder, TextDecoder } from 'util'
import { type Mock, vi } from 'vitest'
import { initializeNavigationState } from '@/navigation/lib'
import { type Dispatch } from 'react'
import { useNavigation, useView } from './src/hooks'
import { type NavigationActionType } from './src/types'
export * from '@testing-library/react'

window.crypto.randomUUID = randomUUID
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
    })
  }
})
