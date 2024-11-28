import { TableProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation/NavigationProvider'
import { render, screen } from '../setupTests'
import { CommandMenu } from '@/components/Commands/Menu'
import userEvent from '@testing-library/user-event'
import { planningListColumns } from '@/views/PlanningOverview/PlanningListColumns'
import { type Planning } from '@/lib/index'
import type { HistoryState } from '@/navigation/hooks/useHistory'

describe('CommandMenu', () => {
  it('should render CommandMenu component', async () => {
    render(
      <NavigationProvider>
        <TableProvider<Planning> columns={planningListColumns({})}>
          <CommandMenu onKeyDown={() => { }} onChange={() => { }}>
            <p>test</p>
          </CommandMenu>
        </TableProvider>
      </NavigationProvider>
    )
    await userEvent.keyboard('{Control>}k')
    expect(screen.getByText('Planning overview')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option'))

    const historyState = history.state as HistoryState
    expect(historyState.contentState[0].name).toBe('Plannings')
  })
})
