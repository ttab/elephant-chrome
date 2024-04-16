import '@testing-library/jest-dom'
import planning from './__tests__/data/planning-index.json'

import { randomUUID } from 'node:crypto'
export * from '@testing-library/react'

window.crypto.randomUUID = randomUUID
const JWT = { sub: 'abc', sub_name: 'ABC', units: ['a', 'b', 'c'], scope: 'AbC', access_token: 'xxx' }

function mockUrl(url: string): unknown {
  switch (url) {
    case '/api/user':
      return JSON.stringify(JWT)

    case '/core_planning_item/_search':
      return planning
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

jest.mock('.@/hooks/useSession.tsx', () => ({
  useSession: jest.fn().mockImplementation(() => { return { jwt: JWT, setJwt: () => { } } })
}))
