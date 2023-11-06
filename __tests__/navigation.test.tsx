import { NavigationProvider } from '@/contexts'
import { render, screen } from '../setupTests'
import { App } from '@/App'

describe('Use NavigationProvider', () => {
  it('should render view from registry', () => {
    render(
      <NavigationProvider>
        <App />
      </NavigationProvider>
    )
    expect(screen.getByText('Init')).toBeInTheDocument()
  })
})
