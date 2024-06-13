import { TableProvider } from '@/contexts'
import { SessionProvider } from 'next-auth/react'
import { NavigationProvider } from '@/navigation'
import { render, screen } from '../setupTests'
import { CommandMenu } from '@/components/CommandMenu'
import userEvent from '@testing-library/user-event'
import { initializeNavigationState } from '@/navigation/lib'
import { type NavigationActionType } from '@/types'
import { type Dispatch } from 'react'
import { useNavigation, useTable } from '@/hooks'

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

jest.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: jest.fn()
}))

jest.mock('@/hooks/useTable', () => ({
  useTable: jest.fn()
}))

const mockState = initializeNavigationState()

const mockDispatch = jest.fn() as Dispatch<NavigationActionType>

(useNavigation as jest.Mock).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
});

(useTable as jest.Mock).mockReturnValue({
  table: {},
  command: {
    pages: [],
    page: ''
  }
})

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
