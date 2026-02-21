import type { Dispatch, SetStateAction } from 'react'
import { type PropsWithChildren } from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DocumentRemoved, DocumentUpdate } from '@ttab/elephant-api/repositorysocket'

import { TableContext } from '@/contexts'
import { useRepositorySocket } from '@/hooks/useRepositorySocket'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import type { DocumentStateWithIncludes, RepositorySocket } from '@/shared/RepositorySocket'
import { defaultLocale } from '@/defaults/locale'
import { Document } from '@ttab/elephant-api/newsdoc'

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn()
  }
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn()
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: vi.fn()
}))

vi.mocked(useRegistry).mockReturnValue(initialState)

import { useRegistry } from '@/hooks/useRegistry'
import type { TableProviderState } from '@/contexts/TableProvider'
import type { DocumentMeta } from '@ttab/elephant-api/repository'
import { initialState } from '@/contexts/RegistryProvider'

const baseRegistryValue = {
  locale: defaultLocale,
  timeZone: 'UTC',
  userColor: '#000',
  server: {
    webSocketUrl: new URL('http://localhost'),
    indexUrl: new URL('http://localhost'),
    repositoryEventsUrl: new URL('http://localhost'),
    repositoryUrl: new URL('http://localhost'),
    contentApiUrl: new URL('http://localhost'),
    spellcheckUrl: new URL('http://localhost'),
    userUrl: new URL('http://localhost'),
    faroUrl: new URL('http://localhost'),
    baboonUrl: new URL('http://localhost')
  },
  dispatch: vi.fn()
}

const makeWrapper = <TData,>(setTableData: Dispatch<SetStateAction<TData[]>>) => {
  const WrapperComponent = ({ children }: PropsWithChildren) => (
    <TableContext.Provider value={{ setData: setTableData } as unknown as TableProviderState<TData>}>
      {children}
    </TableContext.Provider>
  )
  WrapperComponent.displayName = 'TestWrapper'
  return WrapperComponent
}

describe('useRepositorySocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSession).mockReturnValue({
      data: {
        accessToken: 'abc123',
        refreshToken: 'def456',
        accessTokenExpires: 1769266030817,
        expires: '1769266030',
        status: 'authenticated',
        user: {
          name: 'Test User',
          email: 'mail@example.com',
          image: '',
          sub: 'sub000',
          id: '000'
        },
        error: ''
      },
      status: 'authenticated',
      update: vi.fn()
    })
    vi.mocked(useRegistry).mockReturnValue({
      ...baseRegistryValue,
      repositorySocket: undefined
    })
  })

  it('returns an error when repository socket is missing', async () => {
    const { result } = renderHook(() => useRepositorySocket({ type: 'tt/article' }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('No repository socket, type or session available')
    expect(result.current.data).toEqual([])
  })

  it('sets error and shows toast when getDocuments rejects', async () => {
    const socket = {
      get isConnected() { return true },
      get isAuthenticated() { return true },
      connect: vi.fn().mockResolvedValue(undefined),
      authenticate: vi.fn().mockResolvedValue(undefined),
      getDocuments: vi.fn().mockRejectedValue(new Error('WebSocket failure')),
      closeDocumentSet: vi.fn().mockResolvedValue(undefined),
      onReconnect: vi.fn().mockReturnValue(() => {})
    } as unknown as RepositorySocket

    vi.mocked(useRegistry).mockReturnValue({
      ...baseRegistryValue,
      repositorySocket: socket
    })

    const setTableData = vi.fn()
    const wrapper = makeWrapper(setTableData)

    const { result } = renderHook(
      () => useRepositorySocket({ type: 'tt/article', asTable: true }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('WebSocket failure')
    expect(result.current.data).toEqual([])
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Kunde inte hämta dokument')
  })

  it('runs decorators on initial data and enriches documents', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(456)

    const mockDecorator = {
      namespace: 'testNs',
      onInitialData: vi.fn().mockResolvedValue(
        new Map([['included-1', { score: 42 }]])
      ),
      onUpdate: vi.fn()
    }

    const documents: DocumentStateWithIncludes[] = [
      {
        document: Document.create({
          uuid: 'parent-1',
          type: 'core/planning-item'
        }),
        includedDocuments: [{ uuid: 'included-1' }]
      }
    ]

    const socket = {
      get isConnected() { return true },
      get isAuthenticated() { return true },
      connect: vi.fn().mockResolvedValue(undefined),
      authenticate: vi.fn().mockResolvedValue(undefined),
      getDocuments: vi.fn().mockResolvedValue({
        callId: 'call-1',
        documents,
        onUpdate: vi.fn().mockReturnValue(() => {})
      }),
      closeDocumentSet: vi.fn().mockResolvedValue(undefined),
      onReconnect: vi.fn().mockReturnValue(() => {})
    } as unknown as RepositorySocket

    vi.mocked(useRegistry).mockReturnValue({
      ...baseRegistryValue,
      repositorySocket: socket
    })

    const setTableData = vi.fn()
    const wrapper = makeWrapper(setTableData)

    const { result } = renderHook(
      () => useRepositorySocket({
        type: 'core/planning-item',
        asTable: true,
        decorators: [mockDecorator]
      }),
      { wrapper }
    )

    // Wait for initial load
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Wait for decorator enrichment to be applied
    await waitFor(() => {
      const doc = result.current.data[0]
      return expect(doc.decoratorData).toBeDefined()
    })

    expect(mockDecorator.onInitialData).toHaveBeenCalledWith(documents, 'abc123')

    const decoratorData = result.current.data[0].decoratorData as Record<string, Record<string, object>>
    expect(decoratorData.testNs['included-1']).toEqual({ score: 42 })
  })

  it('fetches documents, pushes updates, and cleans up on unmount', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(123)

    const setTableData = vi.fn()

    const unsubscribe = vi.fn()
    let updateCb: ((update: DocumentUpdate | DocumentRemoved) => void) | undefined

    const socketState = {
      isConnected: true,
      isAuthenticated: true
    }

    const mockConnect = vi.fn(() => {
      socketState.isConnected = true
      return Promise.resolve()
    })
    const mockAuthenticate = vi.fn(() => {
      socketState.isAuthenticated = true
      return Promise.resolve()
    })

    const socket = {
      get isConnected() { return socketState.isConnected },
      get isAuthenticated() { return socketState.isAuthenticated },
      connect: mockConnect,
      authenticate: mockAuthenticate,
      getDocuments: vi.fn(({ setName }: { setName: string }) => {
        expect(setName).toBe('tt/article-123')
        return Promise.resolve({
          callId: 'call-1',
          documents: [{ document: { uuid: 'a' } } as DocumentStateWithIncludes],
          onUpdate: (handler: (update: DocumentUpdate | DocumentRemoved) => void) => {
            updateCb = handler
            return unsubscribe
          }
        })
      }),
      closeDocumentSet: vi.fn().mockResolvedValue(undefined),
      onReconnect: vi.fn().mockReturnValue(() => {})
    } as unknown as RepositorySocket

    vi.mocked(useRegistry).mockReturnValue({
      ...baseRegistryValue,
      repositorySocket: socket
    })

    const wrapper = makeWrapper(setTableData)

    const { result, unmount } = renderHook(
      () => useRepositorySocket({ type: 'tt/article', asTable: true }),
      { wrapper }
    )

    /* eslint-disable @typescript-eslint/unbound-method */
    await waitFor(() => expect(socket.getDocuments).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(socket.connect).not.toHaveBeenCalled()
    expect(socket.authenticate).toHaveBeenCalledTimes(1)
    /* eslint-enable @typescript-eslint/unbound-method */

    expect(result.current.error).toBeNull()
    expect(result.current.data.map((d) => d.document?.uuid)).toEqual(['a'])
    expect(setTableData).toHaveBeenCalledWith(expect.any(Array))
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled()

    act(() => {
      updateCb?.({ setName: 'tt/article-123', included: false, document: Document.create({ uuid: 'a' }) })
    })

    await waitFor(() => {
      const first = result.current.data[0] as DocumentUpdate
      expect(first.setName).toBe('tt/article-123')
    })

    act(() => {
      updateCb?.({
        setName: 'tt/article-123',
        included: false,
        meta: { created: '2024-01-01T00:00:00Z', modified: '2024-01-01T00:00:00Z' } as unknown as DocumentMeta,
        document: Document.create({ uuid: 'b' })
      })
    })

    await waitFor(() => expect(result.current.data.map((d) => d.document?.uuid)).toEqual(['b', 'a']))

    act(() => {
      updateCb?.({ setName: 'tt/article-123', documentUuid: 'a' })
    })

    await waitFor(() => expect(result.current.data.map((d) => d.document?.uuid)).toEqual(['b']))

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
    /* eslint-disable-next-line @typescript-eslint/unbound-method */
    await waitFor(() => expect(socket.closeDocumentSet).toHaveBeenCalledWith('tt/article-123'))
  })
})
