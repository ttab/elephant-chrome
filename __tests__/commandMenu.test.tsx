import { SessionProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation/components'
import { render, screen } from '../setupTests'
import { CommandMenu } from '@/components/CommandMenu'
import userEvent from '@testing-library/user-event'

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

describe('CommandMenu', () => {
  it('should render CommandMenu component', async () => {
    render(
      <SessionProvider>
        <NavigationProvider>
          <CommandMenu />
        </NavigationProvider>
      </SessionProvider>
    )
    await userEvent.keyboard('{Control>}k')
    expect(screen.getByText('Planning overview')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option'))
    expect(history.state.viewName).toBe('PlanningOverview')
  })
})
