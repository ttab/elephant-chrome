import { type Dispatch } from 'react'
import * as Y from 'yjs'
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
import { ModalProvider } from '@/components/Modal/ModalProvider'
import { UserTrackerContext } from '@/contexts/UserTrackerProvider'
import type { RegistryProviderState } from '@/contexts/RegistryProvider'
import { RegistryContext } from '@/contexts/RegistryProvider'
import { sv } from 'date-fns/locale'

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

const provider = {
  synced: true,
  document: new Y.Doc()
} as unknown as HocuspocusProvider

const registry = {
  locale: {
    code: {
      full: 'sv-SE',
      short: 'sv',
      long: 'sv'
    },
    module: sv
  },
  timeZone: 'Europe/Stockholm',
  server: {},
  dispatch: {},
  index: {
    query: vi.fn().mockReturnValue({
      ok: true,
      hits: []
    })
  }
} as unknown as RegistryProviderState

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { name: 'Test User', email: 'test@example.com' } },
    status: 'authenticated'
  }))
}))


describe('Use NavigationProvider', () => {
  it('should render view from registry', async () => {
    render(
      <ModalProvider>
        <RegistryContext.Provider value={registry}>
          <IndexedDBProvider>
            <NavigationProvider>
              <UserTrackerContext.Provider value={{ provider, synced: provider.synced, connected: true }}>
                <DocTrackerContext.Provider value={{ synced: true, connected: true, provider }}>
                  <AppContent />
                </DocTrackerContext.Provider>
              </UserTrackerContext.Provider>
            </NavigationProvider>
          </IndexedDBProvider>
        </RegistryContext.Provider>
      </ModalProvider>
    )

    expect(await screen.findByRole('header-title')).toBeInTheDocument()
  })
})
