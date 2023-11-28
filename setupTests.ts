import '@testing-library/jest-dom'
import planning from './__tests__/data/planning.json'
export * from '@testing-library/react'

const JWT = { sub: 'abc', sub_name: 'ABC', units: ['a', 'b', 'c'], scope: 'AbC', access_token: 'xxx' }

function mockUrl(url: string): unknown {
  const path = new URL(url).pathname

  switch (path) {
    case '/user':
      return JSON.stringify(JWT)

    // Fixme: Add and anonymize planning data for mocks
    case '/core_planning_item/_search':
      return planning
    default:
      throw new Error(`No mock data for ${path}`)
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
