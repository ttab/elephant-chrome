import { NavigationProvider, SessionProvider } from '@/contexts'
import { render, screen } from '../setupTests'
import { App } from '@/App'


const JWT = { sub: 'abc', sub_name: 'ABC', units: ['a', 'b', 'c'], scope: 'AbC', access_token: 'xxx' }

jest.mock('../src/hooks/useSession.tsx', () => ({
  useSession: jest.fn().mockImplementation(() => { return { jwt: JWT, setJwt: () => { } } })
}))

global.fetch = jest.fn().mockImplementation(async (url: string) => {
  if (url === 'http://localhost/user') {
    return await Promise.resolve({
      status: 200,
      ok: true,
      text: async () => await Promise.resolve(JSON.stringify(JWT))
    })
  }
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
    expect(await screen.findByText('Init')).toBeInTheDocument()
  })
})
