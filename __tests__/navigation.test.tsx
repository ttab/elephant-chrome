import { type Dispatch } from 'react'
import { NavigationProvider } from '@/navigation/NavigationProvider'

import { useNavigation } from '@/hooks'

import { render, screen } from '../setupTests'
import { type NavigationActionType } from '@/types'
import { initializeNavigationState } from '@/navigation/lib'
import { DocTrackerContext } from '@/contexts/DocTrackerProvider'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { AppContent } from '../src/AppContent'
import { type Mock, vi } from 'vitest'
import { IndexedDBProvider } from '../src/datastore/contexts/IndexedDBProvider'
import indexeddb from 'fake-indexeddb'

globalThis.indexedDB = indexeddb

vi.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: vi.fn()
}))

const mockState = initializeNavigationState()

const mockDispatch = vi.fn() as Dispatch<NavigationActionType>

(useNavigation as Mock).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
})

const provider = true as unknown as HocuspocusProvider

describe('Use NavigationProvider', () => {
  it('should render view from registry', async () => {
    render(
      <IndexedDBProvider>
        <NavigationProvider>
          <DocTrackerContext.Provider value={{ synced: true, connected: true, provider }}>
            <AppContent />
          </DocTrackerContext.Provider>
        </NavigationProvider>
      </IndexedDBProvider>
    )

    expect(await screen.findByRole('header-title')).toBeInTheDocument()
  })
})
