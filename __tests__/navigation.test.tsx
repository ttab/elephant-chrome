import { NavigationProvider, SessionProvider } from '@/contexts'
import { render, screen } from '../setupTests'
import { App } from '@/App'


const JWT = { sub: 'abc', sub_name: 'ABC', units: ['a', 'b', 'c'], scope: 'AbC', access_token: 'xxx' }

jest.mock('../src/hooks/useSession.tsx', () => ({
  useSession: jest.fn().mockImplementation(() => { return { jwt: JWT, setJwt: () => { } } })
}))

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

describe('Use NavigationProvider', () => {
  it('should render view from registry', async () => {
    render(
      <SessionProvider endpoint={new URL('/user', 'http://localhost')}>
        <NavigationProvider>
          <App />
        </NavigationProvider>
      </SessionProvider>
    )
    expect(await screen.findByText('Plannings 2023-11-09')).toBeInTheDocument()
  })
})
