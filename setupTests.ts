import '@testing-library/jest-dom'
export * from '@testing-library/react'

const JWT = { sub: 'abc', sub_name: 'ABC', units: ['a', 'b', 'c'], scope: 'AbC', access_token: 'xxx' }

function mockUrl(url: string): unknown {
  switch (url.split('/')[1]) {
    case 'user':
      return JSON.stringify(JWT)

    // Fixme: Add and anonymize planning data for mocks
    case 'core_planning_item/_search':
      return ''
  }
}
global.fetch = jest.fn().mockImplementation(async (url: string) => {
  return await Promise.resolve({
    status: 200,
    ok: true,
    text: async () => await Promise.resolve(mockUrl(url))
  })
})

jest.mock('.@/hooks/useSession.tsx', () => ({
  useSession: jest.fn().mockImplementation(() => { return { jwt: JWT, setJwt: () => { } } })
}))
