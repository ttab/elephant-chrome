import { type Dispatch } from 'react'
import { SessionProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation'

import { useNavigation } from '@/navigation/hooks'

import { render, screen } from '../setupTests'
import { App } from '@/App'
import { type NavigationActionType } from '@/types'
import { initializeNavigationState } from '@/navigation/lib'

jest.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: jest.fn()
}))
const mockState = initializeNavigationState()

const mockDispatch = jest.fn() as Dispatch<NavigationActionType>

(useNavigation as jest.Mock).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
})

describe('Use NavigationProvider', () => {
  it('should render view from registry', async () => {
    render(
      <SessionProvider>
        <NavigationProvider>
          <App />
        </NavigationProvider>
      </SessionProvider>
    )
    expect(await screen.findByText(/Planeringsöversikt/)).toBeInTheDocument()
  })
})
