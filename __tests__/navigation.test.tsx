import { type Dispatch } from 'react'
import { SessionProvider, TableProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation'

import { useNavigation, useTable } from '@/hooks'

import { render, screen } from '../setupTests'
import { App } from '@/App'
import { type NavigationActionType } from '@/types'
import { initializeNavigationState } from '@/navigation/lib'

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

describe('Use NavigationProvider', () => {
  it('should render view from registry', async () => {
    render(
      <SessionProvider>
        <NavigationProvider>
          <TableProvider>
            <App />
          </TableProvider>
        </NavigationProvider>
      </SessionProvider>
    )
    expect(await screen.findByText(/Planeringsöversikt/)).toBeInTheDocument()
  })
})
