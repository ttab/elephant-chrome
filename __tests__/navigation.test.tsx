import { type Dispatch } from 'react'
import * as Y from 'yjs'
import { NavigationProvider } from '@/navigation/NavigationProvider'
import { useNavigation, useRegistry } from '@/hooks'
import { render, screen } from '../setupTests'
import type { NavigationAction } from '@/types'
import { initializeNavigationState } from '@/navigation/lib'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { AppContent } from '../src/AppContent'
import { IndexedDBProvider } from '../src/datastore/contexts/IndexedDBProvider'
import indexeddb from 'fake-indexeddb'
import { ModalProvider } from '@/components/Modal/ModalProvider'
import { UserTrackerContext } from '@/contexts/UserTrackerProvider'
import { initialState } from '@/contexts/RegistryProvider'

globalThis.indexedDB = indexeddb

vi.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: vi.fn()
}))

const mockState = initializeNavigationState()

history.pushState({
  viewId: 'eddbfe39-57d4-4b32-b9a1-a555e39139ea',
  contentState: [
    {
      viewId: 'eddbfe39-57d4-4b32-b9a1-a555e39139ea',
      name: 'Plannings',
      props: {},
      path: '/'
    }
  ]
}, '', '/')

const mockDispatch = vi.fn() as Dispatch<NavigationAction>


vi.mocked(useNavigation).mockReturnValue({
  state: mockState,
  dispatch: mockDispatch
})


vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: vi.fn()
}))

vi.mocked(useRegistry).mockReturnValue(initialState)
const provider = {
  synced: true,
  document: new Y.Doc()
} as unknown as HocuspocusProvider

describe('Use NavigationProvider', () => {
  it('should render view from registry', async () => {
    render(
      <ModalProvider>
        <IndexedDBProvider>
          <NavigationProvider>
            <UserTrackerContext.Provider value={{ provider, synced: provider.synced, connected: true }}>
              <AppContent />
            </UserTrackerContext.Provider>
          </NavigationProvider>
        </IndexedDBProvider>
      </ModalProvider>
    )

    expect(await screen.findByRole('header-title')).toBeInTheDocument()
  })
})
