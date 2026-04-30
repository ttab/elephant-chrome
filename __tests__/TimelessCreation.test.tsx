import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TimelessCreation } from '@/views/TimelessCreation'
import { useRegistry } from '@/hooks/useRegistry'
import { useSections } from '@/hooks/useSections'
import { useActiveAuthor } from '@/hooks/useActiveAuthor'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import { initialState } from '@/contexts/RegistryProvider'

vi.mock('@/hooks/useRegistry', () => ({ useRegistry: vi.fn() }))
vi.mock('@/hooks/useSections', () => ({ useSections: vi.fn() }))
vi.mock('@/hooks/useActiveAuthor', () => ({ useActiveAuthor: vi.fn() }))
vi.mock('@/hooks/useFeatureFlags', () => ({ useFeatureFlags: vi.fn() }))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = ResizeObserverMock
Element.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.hasPointerCapture = vi.fn()

describe('TimelessCreation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRegistry).mockReturnValue(initialState)
    vi.mocked(useSections).mockReturnValue([])
    vi.mocked(useActiveAuthor).mockReturnValue(undefined as never)
    vi.mocked(useFeatureFlags).mockReturnValue({ hasLooseSlugline: false } as never)
  })

  // Regression: Form.Group's cloneChildrenWithProps overwrites onChange with
  // undefined when an Input is a direct child. The slugline Input must be
  // shielded by a fragment so typing actually updates the value.
  it('accepts text input in the slugline field', async () => {
    const user = userEvent.setup()
    render(<TimelessCreation id='test-id' onClose={vi.fn()} />)

    const slugline = screen.getByPlaceholderText(/lägg till slugg/i)
    await user.type(slugline, 'test-slug')

    expect(slugline).toHaveValue('test-slug')
  })

  it('hides the slugline input when hasLooseSlugline is enabled', () => {
    vi.mocked(useFeatureFlags).mockReturnValue({ hasLooseSlugline: true } as never)

    render(<TimelessCreation id='test-id' onClose={vi.fn()} />)

    expect(screen.queryByPlaceholderText(/lägg till slugg/i)).not.toBeInTheDocument()
  })
})
