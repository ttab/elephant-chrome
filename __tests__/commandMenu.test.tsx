import { TableProvider } from '@/contexts'
import { SessionProvider } from 'next-auth/react'
import { NavigationProvider } from '@/navigation'
import { render, screen } from '../setupTests'
import { CommandMenu } from '@/components/CommandMenu'
import userEvent from '@testing-library/user-event'

describe('CommandMenu', () => {
  it('should render CommandMenu component', async () => {
    render(
      <SessionProvider>
        <NavigationProvider>
          <TableProvider>
            <CommandMenu onKeyDown={() => { }} onChange={() => { }}>
              <p>test</p>
            </CommandMenu>
          </TableProvider>
        </NavigationProvider>
      </SessionProvider>
    )
    await userEvent.keyboard('{Control>}k')
    expect(screen.getByText('Planning overview')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option'))
    expect(history.state.viewName).toBe('PlanningOverview')
  })
})
