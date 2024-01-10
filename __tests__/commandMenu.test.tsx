import { SessionProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation'
import { render, screen } from '../setupTests'
import { CommandMenu } from '@/components/CommandMenu'
import userEvent from '@testing-library/user-event'
import { initializeNavigationState } from '@/navigation/lib'
import { type NavigationActionType } from '@/types'
import { type Dispatch } from 'react'
import { useNavigation } from '@/hooks'

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

jest.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: jest.fn()
}))
const mockState = initializeNavigationState()

const mockDispatch = jest.fn() as Dispatch<NavigationActionType>

(useNavigation as jest.Mock).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
})

describe('CommandMenu', () => {
  it('should render CommandMenu component', async () => {
    render(
      <SessionProvider>
        <NavigationProvider>
          <CommandMenu onKeyDown={() => {}} onChange={() => {}} />
        </NavigationProvider>
      </SessionProvider>
    )
    await userEvent.keyboard('{Control>}k')
    expect(screen.getByText('Planning overview')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option'))
    expect(history.state.viewName).toBe('PlanningOverview')
  })
})
