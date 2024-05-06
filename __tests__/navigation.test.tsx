import { type Dispatch } from 'react'
import { SessionProvider } from '@/contexts'
import { NavigationProvider } from '@/navigation'

import { useNavigation, useTable } from '@/hooks'

import { render, screen } from '../setupTests'
import { type NavigationActionType } from '@/types'
import { initializeNavigationState } from '@/navigation/lib'
import { DocTrackerContext } from '@/contexts/DocTrackerProvider'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { AppContent } from '../src/AppContent'

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

const provider = true as unknown as HocuspocusProvider

describe('Use NavigationProvider', () => {
  it('should render view from registry', async () => {
    render(
      <SessionProvider>
        <NavigationProvider>
          <DocTrackerContext.Provider value={{ synced: true, connected: true, provider }}>
            <AppContent />
          </DocTrackerContext.Provider>
        </NavigationProvider>
      </SessionProvider >
    )

    expect(await screen.findByText(/Planeringsöversikt/)).toBeInTheDocument()
  })
})
