import { TableProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation'
import { render, screen } from '../setupTests'
import { CommandMenu } from '@/components/Commands/Menu'
import userEvent from '@testing-library/user-event'
import { planningTableColumns } from '@/views/PlanningOverview/PlanningListColumns'
import { type Planning } from '@/lib/index'

describe('CommandMenu', () => {
  it('should render CommandMenu component', async () => {
    render(
      <NavigationProvider>
        <TableProvider<Planning> columns={planningTableColumns({})}>
          <CommandMenu onKeyDown={() => { }} onChange={() => { }}>
            <p>test</p>
          </CommandMenu>
        </TableProvider>
      </NavigationProvider>
    )
    await userEvent.keyboard('{Control>}k')
    expect(screen.getByText('Planning overview')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option'))
    expect(history.state.viewName).toBe('Plannings')
  })
})
