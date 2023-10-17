import { NavigationProvider } from '@/contexts/NavigationProvider'
import { render } from '../setupTests'
describe('Use NavigationProvider', () => {
  it('should render the navigation wrapper', () => {
    render(
      <NavigationProvider>
        <p>test</p>
      </NavigationProvider>
    )
  })
})
