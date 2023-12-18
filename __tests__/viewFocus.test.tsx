import { type Dispatch } from 'react'
import { SessionProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation/components'
import userEvent from '@testing-library/user-event'

import { useNavigation } from '@/navigation/hooks'

import { render, screen } from '../setupTests'
import { ViewFocus } from '@/components/ViewHeader/ViewFocus'
import { type NavigationActionType } from '@/types'
import { initializeNavigationState } from '@/lib/initializeNavigationState'


jest.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: jest.fn()
}))
const mockState = initializeNavigationState()

const mockDispatch = jest.fn() as Dispatch<NavigationActionType>

(useNavigation as jest.Mock).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
})

describe('ViewFocus', () => {
  it('should render ViewFocus component', async () => {
    render(
      <SessionProvider>
        <NavigationProvider>
          <ViewFocus id={'abc123'} />
        </NavigationProvider>
      </SessionProvider>
    )

    // Open with button, close with escape
    await userEvent.click(screen.getByRole('button'))
    mockState.focus = 'abc123'
    await userEvent.keyboard('{Escape}')
    expect(mockDispatch).toHaveBeenCalledWith({ id: 'abc123', type: 'focus' })
  })
})
