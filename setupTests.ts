import '@testing-library/jest-dom'
import planning from './__tests__/data/planning-index.json'

import { randomUUID } from 'node:crypto'
import { TextEncoder, TextDecoder } from 'util'
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
global.fetch = jest.fn().mockImplementation(async (url: string) => {
  return await Promise.resolve({
    status: 200,
    ok: true,
    text: async () => await Promise.resolve(mockUrl(url)),
    json: async () => await Promise.resolve(mockUrl(url))
  })
})

jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react')
  const mockSession = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    user: { name: 'Testy Test' }
  }
  return {
    __esModule: true,
    ...originalModule,
    useSession: jest.fn(() => {
      return { data: mockSession, status: 'authenticated' } // return type is [] in v3 but changed to {} in v4
    })
  }
})
