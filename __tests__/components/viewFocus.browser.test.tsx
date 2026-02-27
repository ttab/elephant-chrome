import { type Dispatch } from 'react'
import { NavigationProvider } from '@/navigation/NavigationProvider'
import { render } from 'vitest-browser-react'
import { useNavigation } from '@/hooks'
import { ViewFocus } from '@/components/View/ViewHeader/ViewFocus'
import { type NavigationAction } from '@/types'
import { initializeNavigationState } from '@/navigation/lib'
import { userEvent } from 'vitest/browser'

vi.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: vi.fn()
}))

const mockState = initializeNavigationState()

const mockDispatch = vi.fn() as Dispatch<NavigationAction>

vi.mocked(useNavigation).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
})

describe('ViewFocus', () => {
  it('should render ViewFocus component', async () => {
    const screen = await render(
      <NavigationProvider>
        <ViewFocus viewId='abc123' />
      </NavigationProvider>
    )

    // Open with button, close with escape
    await screen.getByRole('button').click()
    mockState.focus = 'abc123'
    await userEvent.keyboard('{Escape}')
    expect(mockDispatch).toHaveBeenCalledWith(
      { viewId: 'abc123', type: 'focus' }
    )
  })
})
