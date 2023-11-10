import { NavigationProvider, SessionProvider } from '@/contexts'
import { render, screen } from '../setupTests'
import { App } from '@/App'


const JWT = { sub: 'abc', sub_name: 'ABC', units: ['a', 'b', 'c'], scope: 'AbC' }

jest.mock('../src/hooks/useSession.tsx', () => ({
  useSession: jest.fn().mockImplementation(() => [JWT, () => {}])
}))

global.fetch = jest.fn().mockImplementation(async (url) => {
  if (url === '/user') {
    return await Promise.resolve({
      status: 200,
      ok: true,
      json: async () => await Promise.resolve(JWT)
    })
  }
})

describe('Use NavigationProvider', () => {
  it('should render view from registry', async () => {
    render(
      <SessionProvider endpoint='/user'>
        <NavigationProvider>
          <App />
        </NavigationProvider>
      </SessionProvider>
    )
    expect(await screen.findByText('Init')).toBeInTheDocument()
  })
})
