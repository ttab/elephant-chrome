import { NavigationProvider } from '@/contexts'
import type { NavigationState } from '@/types'
import { render, screen } from '../setupTests'
import App from '@/App'

function init(): NavigationState {
  return {
    registry: {
      get: () => {
        return {
          metadata: {
            path: '/',
            name: 'Test'
          },
          component: () => <p>test</p>
        }
      },
      set: () => {}
    },
    content: []
  }
}

describe('Use NavigationProvider', () => {
  it('should render view from registry', () => {
    render(
      <NavigationProvider init={init}>
        <App />
      </NavigationProvider>
    )
    expect(screen.getByText('test')).toBeInTheDocument()
  })
})
