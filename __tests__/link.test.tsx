import { SessionProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation'
import userEvent from '@testing-library/user-event'

import { render, screen } from '../setupTests'
import { Link } from '@/components'
import { initializeNavigationState } from '@/navigation/lib'
import { type NavigationActionType } from '@/types'
import { type Dispatch } from 'react'
import { useNavigation } from '@/hooks'

jest.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: jest.fn()
}))
const mockState = initializeNavigationState()

const mockDispatch = jest.fn() as Dispatch<NavigationActionType>

(useNavigation as jest.Mock).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
})

describe('Link', () => {
  it('should render Link component', async () => {
    render(
      <SessionProvider>
        <NavigationProvider>
          <Link to='Editor' props={{ id: 'abc123' }}>
            Planning Overview
          </Link>
        </NavigationProvider>
      </SessionProvider>
    )
    expect(screen.getByText('Planning Overview')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Planning Overview'))
    setTimeout(() => {
      expect(history.state.contentState[0].props.id).toBe('abc123')
      expect(history.state.viewName).toBe('Editor')
      expect(history.state.contentState[0].path).toBe('/editor?id=abc123')
    })
  })
})
