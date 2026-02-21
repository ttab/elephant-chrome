import { type MouseEvent as ReactMouseEvent, type PropsWithChildren, type ReactElement } from 'react'
import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useActivity } from '@/lib/documentActivity/useActivity'
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
    name: 'Planning',
    path: '/planning',
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

function wrapper({ children }: PropsWithChildren): ReactElement {
  return (
    <DocumentActivityProvider>
      {children}
    </DocumentActivityProvider>
  )
}

describe('useActivity', () => {
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

  it('returns null when no matching activity is registered', () => {
    const { result } = renderHook(
      () => useActivity('open', 'core/planning-item'),
      { wrapper }
    )

    expect(result.current).toBeNull()
  })

  it('returns an activity handle when registered', () => {
    unregisters.push(
      documentActivityRegistry.register('core/planning-item', 'open', {
        title: 'Open planning',
        viewRouteFunc: (docId) => Promise.resolve({
          viewName: 'Planning',
          props: { id: docId }
        })
      })
    )

    const { result } = renderHook(
      () => useActivity('open', 'core/planning-item'),
      { wrapper }
    )

    expect(result.current).not.toBeNull()
    expect(result.current?.title).toBe('Open planning')
    expect(typeof result.current?.execute).toBe('function')
  })

  it('execute calls handleLink with resolved route', async () => {
    unregisters.push(
      documentActivityRegistry.register('core/planning-item', 'open', {
        title: 'Open planning',
        viewRouteFunc: (docId) => Promise.resolve({
          viewName: 'Planning',
          props: { id: docId }
        })
      })
    )

    const { result } = renderHook(
      () => useActivity('open', 'core/planning-item'),
      { wrapper }
    )

    result.current?.execute('plan-123')

    // Wait for the async viewRouteFunc to resolve
    await vi.waitFor(() => {
      expect(handleLink).toHaveBeenCalled()
    })

    expect(mockViewRegistry.get).toHaveBeenCalledWith('Planning')
    expect(handleLink).toHaveBeenCalledWith(
      expect.objectContaining({
        dispatch: mockDispatch,
        viewItem: mockViewItem,
        props: { id: 'plan-123' },
        origin: 'origin-view',
        history: mockHistory
      })
    )
  })

  it('execute calls preventDefault and stopPropagation on event', async () => {
    unregisters.push(
      documentActivityRegistry.register('core/planning-item', 'open', {
        title: 'Open planning',
        viewRouteFunc: (docId) => Promise.resolve({
          viewName: 'Planning',
          props: { id: docId }
        })
      })
    )

    const { result } = renderHook(
      () => useActivity('open', 'core/planning-item'),
      { wrapper }
    )

    const preventDefault = vi.fn()
    const stopPropagation = vi.fn()
    const mockEvent = {
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault,
      stopPropagation
    } as unknown as ReactMouseEvent<Element>

    result.current?.execute('plan-123', mockEvent)

    expect(preventDefault).toHaveBeenCalled()
    expect(stopPropagation).toHaveBeenCalled()

    await vi.waitFor(() => {
      expect(handleLink).toHaveBeenCalled()
    })
  })

  it('returns early on ctrlKey', async () => {
    unregisters.push(
      documentActivityRegistry.register('core/planning-item', 'open', {
        title: 'Open planning',
        viewRouteFunc: (docId) => Promise.resolve({
          viewName: 'Planning',
          props: { id: docId }
        })
      })
    )

    const { result } = renderHook(
      () => useActivity('open', 'core/planning-item'),
      { wrapper }
    )

    const preventDefault = vi.fn()
    const mockEvent = {
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      preventDefault,
      stopPropagation: vi.fn()
    } as unknown as ReactMouseEvent<Element>

    result.current?.execute('plan-123', mockEvent)

    // Give time for async to potentially run
    await new Promise((r) => setTimeout(r, 10))

    expect(preventDefault).not.toHaveBeenCalled()
    expect(handleLink).not.toHaveBeenCalled()
  })

  it('passes target "last" when shiftKey is pressed', async () => {
    unregisters.push(
      documentActivityRegistry.register('core/planning-item', 'open', {
        title: 'Open planning',
        viewRouteFunc: (docId) => Promise.resolve({
          viewName: 'Planning',
          props: { id: docId }
        })
      })
    )

    const { result } = renderHook(
      () => useActivity('open', 'core/planning-item'),
      { wrapper }
    )

    const mockEvent = {
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as ReactMouseEvent<Element>

    result.current?.execute('plan-123', mockEvent)

    await vi.waitFor(() => {
      expect(handleLink).toHaveBeenCalled()
    })

    expect(handleLink).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 'last'
      })
    )
  })

  it('passes keepFocus when Space key is pressed', async () => {
    unregisters.push(
      documentActivityRegistry.register('core/planning-item', 'open', {
        title: 'Open planning',
        viewRouteFunc: (docId) => Promise.resolve({
          viewName: 'Planning',
          props: { id: docId }
        })
      })
    )

    const { result } = renderHook(
      () => useActivity('open', 'core/planning-item'),
      { wrapper }
    )

    const mockEvent = new KeyboardEvent('keydown', { key: ' ' })
    vi.spyOn(mockEvent, 'preventDefault')
    vi.spyOn(mockEvent, 'stopPropagation')

    result.current?.execute('plan-123', mockEvent)

    await vi.waitFor(() => {
      expect(handleLink).toHaveBeenCalled()
    })

    expect(handleLink).toHaveBeenCalledWith(
      expect.objectContaining({
        keepFocus: true
      })
    )
  })

  it('shows toast on viewRouteFunc error', async () => {
    const { toast } = await import('sonner')

    unregisters.push(
      documentActivityRegistry.register('core/planning-item', 'open', {
        title: 'Open planning',
        viewRouteFunc: () => Promise.reject(new Error('Something went wrong'))
      })
    )

    const { result } = renderHook(
      () => useActivity('open', 'core/planning-item'),
      { wrapper }
    )

    result.current?.execute('plan-123')

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Could not execute "Open planning": Something went wrong'
    )
    expect(handleLink).not.toHaveBeenCalled()
  })

  it('forwards args to viewRouteFunc', async () => {
    const viewRouteFunc = vi.fn().mockResolvedValue({
      viewName: 'Planning',
      props: { id: 'plan-123' }
    })

    unregisters.push(
      documentActivityRegistry.register('core/article', 'open-planning', {
        title: 'Open planning',
        viewRouteFunc
      })
    )

    const args = { planningId: 'plan-456' }
    const { result } = renderHook(
      () => useActivity('open-planning', 'core/article', args),
      { wrapper }
    )

    result.current?.execute('article-789')

    await vi.waitFor(() => {
      expect(viewRouteFunc).toHaveBeenCalled()
    })

    expect(viewRouteFunc).toHaveBeenCalledWith('article-789', args)
  })

  it('matches wildcard registrations', () => {
    unregisters.push(
      documentActivityRegistry.register('*', 'history', {
        title: 'View history',
        viewRouteFunc: (docId) => Promise.resolve({
          viewName: 'History',
          props: { id: docId }
        })
      })
    )

    const { result } = renderHook(
      () => useActivity('history', 'core/planning-item'),
      { wrapper }
    )

    expect(result.current).not.toBeNull()
    expect(result.current?.title).toBe('View history')
  })
})
