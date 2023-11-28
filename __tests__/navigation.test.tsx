import { SessionProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation/components'

import { App } from '@/App'
import { render, screen } from '../setupTests'

describe('Use NavigationProvider', () => {
  it('should render view from registry', async () => {
    render(
      <SessionProvider endpoint={new URL('/user', 'http://localhost')}>
        <NavigationProvider>
          <App />
        </NavigationProvider>
      </SessionProvider>
    )
    expect(await screen.findByText(/AaaBbbCcc/)).toBeInTheDocument()
  })
})
