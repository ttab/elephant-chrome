import { type PropsWithChildren, type JSX } from 'react'
import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useDocumentActivities } from '@/lib/documentActivity/useDocumentActivities'
import { DocumentActivityProvider } from '@/lib/documentActivity/DocumentActivityProvider'
import { documentActivityRegistry } from '@/lib/documentActivity/registry'
import { useNavigation, useHistory, useView } from '@/hooks'
import { handleLink } from '@/components/Link/lib/handleLink'
import type { NavigationState, ViewRegistryItem } from '@/types'
import type { HistoryInterface } from '@/navigation/hooks/useHistory'

vi.mock('@/navigation/hooks/useNavigation', () => ({
  useNavigation: vi.fn()
}))

vi.mock('@/navigation/hooks/useHistory', () => ({
  useHistory: vi.fn()
}))

vi.mock('@/hooks/useView', () => ({
  useView: vi.fn()
}))

vi.mock('@/components/Link/lib/handleLink', () => ({
  handleLink: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn()
  }
}))

const mockViewItem: ViewRegistryItem = {
  meta: {
    name: 'Editor',
    path: '/editor',
    widths: { sm: 12, md: 12, lg: 6, xl: 6, '2xl': 6, hd: 6, fhd: 4, qhd: 3, uhd: 2 }
  },
  component: () => null
}

const mockViewRegistry = {
  get: vi.fn().mockReturnValue(mockViewItem),
  set: vi.fn()
}

const mockHistory = {
  state: null,
  pushState: vi.fn(),
  replaceState: vi.fn(),
  setActiveView: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn()
} as HistoryInterface

const mockDispatch = vi.fn()

function setup(): void {
  vi.mocked(useNavigation).mockReturnValue({
    state: {
      viewRegistry: mockViewRegistry,
      focus: null,
      active: 'test-view',
      content: []
    } as unknown as NavigationState,
    dispatch: mockDispatch
  })

  vi.mocked(useHistory).mockReturnValue(mockHistory)

  vi.mocked(useView).mockReturnValue({
    viewId: 'origin-view',
    name: 'Plannings',
    isActive: true,
    isFocused: true,
    isHidden: false
  })
}

function wrapper({ children }: PropsWithChildren): JSX.Element {
  return (
    <DocumentActivityProvider>
      {children}
    </DocumentActivityProvider>
  )
}

describe('useDocumentActivities', () => {
  let unregisters: Array<() => void>

  beforeEach(() => {
    vi.clearAllMocks()
    unregisters = []
    setup()
  })

  afterEach(() => {
    for (const unregister of unregisters) {
      unregister()
    }
  })

  it('returns empty array when no activities registered', () => {
    const { result } = renderHook(
      () => useDocumentActivities('core/article', 'doc-1'),
      { wrapper }
    )

    expect(result.current).toEqual([])
  })

  it('returns registered activities for document type', () => {
    unregisters.push(
      documentActivityRegistry.register('core/article', 'open', {
        title: 'Open in editor',
        viewRouteFunc: (docId) => Promise.resolve({
          viewName: 'Editor',
          props: { id: docId }
        })
      })
    )

    const { result } = renderHook(
      () => useDocumentActivities('core/article', 'doc-1'),
      { wrapper }
    )

    expect(result.current).toHaveLength(1)
    expect(result.current[0].activityId).toBe('open')
    expect(result.current[0].title).toBe('Open in editor')
  })

  it('execute calls handleLink with resolved route', async () => {
    unregisters.push(
      documentActivityRegistry.register('core/article', 'open', {
        title: 'Open in editor',
        viewRouteFunc: (docId) => Promise.resolve({
          viewName: 'Editor',
          props: { id: docId }
        })
      })
    )

    const { result } = renderHook(
      () => useDocumentActivities('core/article', 'doc-123'),
      { wrapper }
    )

    result.current[0].execute()

    await vi.waitFor(() => {
      expect(handleLink).toHaveBeenCalled()
    })

    expect(mockViewRegistry.get).toHaveBeenCalledWith('Editor')
    expect(handleLink).toHaveBeenCalledWith(
      expect.objectContaining({
        dispatch: mockDispatch,
        viewItem: mockViewItem,
        props: { id: 'doc-123' },
        origin: 'origin-view',
        history: mockHistory
      })
    )
  })

  it('execute passes target from resolved route', async () => {
    unregisters.push(
      documentActivityRegistry.register('core/article', 'open', {
        title: 'Open in editor',
        viewRouteFunc: (docId) => Promise.resolve({
          viewName: 'Editor',
          props: { id: docId },
          target: 'last'
        })
      })
    )

    const { result } = renderHook(
      () => useDocumentActivities('core/article', 'doc-123'),
      { wrapper }
    )

    result.current[0].execute()

    await vi.waitFor(() => {
      expect(handleLink).toHaveBeenCalled()
    })

    expect(handleLink).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 'last'
      })
    )
  })

  it('shows toast on viewRouteFunc error', async () => {
    const { toast } = await import('sonner')

    unregisters.push(
      documentActivityRegistry.register('core/article', 'open-planning', {
        title: 'Open planning',
        viewRouteFunc: () => Promise.reject(new Error('No planning ID provided'))
      })
    )

    const { result } = renderHook(
      () => useDocumentActivities('core/article', 'doc-1'),
      { wrapper }
    )

    void result.current[0].execute()

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Could not open "Open planning": No planning ID provided'
    )
    expect(handleLink).not.toHaveBeenCalled()
  })
})
