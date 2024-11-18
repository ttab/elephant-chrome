import '@testing-library/jest-dom'
import planning from './__tests__/data/planning-index.json'

import { randomUUID } from 'node:crypto'
import { TextEncoder, TextDecoder } from 'util'
import { type Mock, vi } from 'vitest'
import { initializeNavigationState } from '@/navigation/lib'
import { type Dispatch } from 'react'
import { useNavigation } from './src/hooks'
import { type NavigationActionType } from './src/types'
export * from '@testing-library/react'

window.crypto.randomUUID = randomUUID
global.TextEncoder = TextEncoder
// @ts-expect-error unknown
global.TextDecoder = TextDecoder

function mockUrl(url: string): unknown {
  switch (url) {
    case '/core_planning_item/_search':
      return planning

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


vi.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: vi.fn()
}))
const mockState = initializeNavigationState()

history.pushState({
  viewId: 'eddbfe39-57d4-4b32-b9a1-a555e39139ea',
  content: [
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
    user: { name: 'Testy Test' }
  }
  return {
    __esModule: true,
    ...originalModule,
    useSession: vi.fn(() => {
      return { data: mockSession, status: 'authenticated' }
    })
  }
})
