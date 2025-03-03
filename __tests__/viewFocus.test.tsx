import { type Dispatch } from 'react'
import { NavigationProvider } from '@/navigation/NavigationProvider'
import userEvent from '@testing-library/user-event'
import { useNavigation } from '@/hooks'
import { render, screen } from '../setupTests'
import { ViewFocus } from '@/components/View/ViewHeader/ViewFocus'
import { type NavigationActionType } from '@/types'
import { initializeNavigationState } from '@/navigation/lib'
import { type Mock, vi } from 'vitest'


vi.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: vi.fn()
}))
const mockState = initializeNavigationState()

const mockDispatch = vi.fn() as Dispatch<NavigationActionType>

(useNavigation as Mock).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
})

describe('ViewFocus', () => {
  it('should render ViewFocus component', async () => {
    render(
      <NavigationProvider>
        <ViewFocus viewId='abc123' />
      </NavigationProvider>
    )

    // Open with button, close with escape
    await userEvent.click(screen.getByRole('button'))
    mockState.focus = 'abc123'
    await userEvent.keyboard('{Escape}')
    expect(mockDispatch).toHaveBeenCalledWith({ viewId: 'abc123', type: 'focus' })
  })
})
