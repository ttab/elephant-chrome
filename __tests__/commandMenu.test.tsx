import { TableProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation/NavigationProvider'
import { render, screen } from '../setupTests'
import { CommandMenu } from '@/components/Commands/Menu'
import userEvent from '@testing-library/user-event'
import { planningListColumns } from '@/views/PlanningOverview/PlanningListColumns'
import { type Planning } from '@/shared/schemas/planning'
import type { HistoryState } from '@/navigation/hooks/useHistory'
import i18n from '@/lib/i18n'

describe('CommandMenu', () => {
  it('should render CommandMenu component', async () => {
    render(
      <NavigationProvider>
        <TableProvider<Planning>
          type='Plannings'
          columns={planningListColumns({})}
        >
          <CommandMenu onKeyDown={() => { }} onChange={() => { }}>
            <p>test</p>
          </CommandMenu>
        </TableProvider>
      </NavigationProvider>
    )
    await userEvent.keyboard('{Control>}k')
    expect(screen.getByText(i18n.t('views:plannings.label.plural'))).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option'))

    const historyState = history.state as HistoryState
    expect(historyState.contentState[0].name).toBe('Plannings')
  })
})
