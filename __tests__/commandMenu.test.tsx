import { PlanningTableProvider } from '@/contexts'
import { SessionProvider } from 'next-auth/react'
import { NavigationProvider } from '@/navigation'
import { render, screen } from '../setupTests'
import { PlanningCommandMenu } from '@/components/CommandMenu/PlanningCommandMenu'
import userEvent from '@testing-library/user-event'

describe('CommandMenu', () => {
  it('should render CommandMenu component', async () => {
    render(
      <SessionProvider>
        <NavigationProvider>
          <PlanningTableProvider>
            <PlanningCommandMenu onKeyDown={() => { }} onChange={() => { }}>
              <p>test</p>
            </PlanningCommandMenu>
          </PlanningTableProvider>
        </NavigationProvider>
      </SessionProvider>
    )
    await userEvent.keyboard('{Control>}k')
    expect(screen.getByText('Planning overview')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option'))
    expect(history.state.viewName).toBe('Plannings')
  })
})
