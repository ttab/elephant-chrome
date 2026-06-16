import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TimelessCreation } from '@/views/TimelessCreation'
import { useRegistry } from '@/hooks/useRegistry'
import { useSections } from '@/hooks/useSections'
import { useActiveAuthor } from '@/hooks/useActiveAuthor'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import { useTimelessCategories } from '@/hooks/useTimelessCategories'
import { initialState } from '@/contexts/RegistryProvider'
import { submitTimeless } from '@/views/TimelessCreation/lib/submitTimeless'
import { fetch as fetchPlannings } from '@/lib/index/fetch-plannings-twirp'

vi.mock('@/hooks/useRegistry', () => ({ useRegistry: vi.fn() }))
vi.mock('@/hooks/useSections', () => ({ useSections: vi.fn() }))
vi.mock('@/hooks/useActiveAuthor', () => ({ useActiveAuthor: vi.fn() }))
vi.mock('@/hooks/useFeatureFlags', () => ({ useFeatureFlags: vi.fn() }))
vi.mock('@/hooks/useTimelessCategories', () => ({ useTimelessCategories: vi.fn() }))
vi.mock('@/views/TimelessCreation/lib/submitTimeless', () => ({ submitTimeless: vi.fn() }))
vi.mock('@/lib/index/fetch-plannings-twirp', () => ({ fetch: vi.fn() }))

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
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()

const CATEGORY = { id: 'cat-1', title: 'Sport' }
const SECTION = { id: 'sec-1', title: 'Inrikes' }

type PlanningOption = Awaited<ReturnType<typeof fetchPlannings>>[number]

const planningOption = (overrides: Partial<PlanningOption['payload']> = {}): PlanningOption => ({
  value: 'plan-1',
  label: 'Picked planning',
  info: '',
  icon: undefined,
  iconProps: undefined,
  payload: {
    slugline: 'planning-slug',
    sluglines: [],
    section: SECTION.id,
    startDate: '2026-05-19',
    newsvalue: '3',
    ...overrides
  }
})

describe('TimelessCreation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRegistry).mockReturnValue({
      ...initialState,
      timeZone: 'Europe/Stockholm'
    })
    vi.mocked(useSections).mockReturnValue([SECTION])
    vi.mocked(useTimelessCategories).mockReturnValue([CATEGORY])
    vi.mocked(useActiveAuthor).mockReturnValue(undefined as never)
    vi.mocked(useFeatureFlags).mockReturnValue({ hasLooseSlugline: false } as never)
    vi.mocked(fetchPlannings).mockResolvedValue([])
    vi.mocked(submitTimeless).mockResolvedValue('test-id')
  })

  // Form.Group's cloneChildrenWithProps strips onChange from direct Input children; the fragment shield must stay.
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

  it('hides slugline and section inputs once a planning is picked', async () => {
    vi.mocked(fetchPlannings).mockResolvedValue([planningOption()])

    const user = userEvent.setup()
    render(<TimelessCreation id='test-id' onClose={vi.fn()} />)

    expect(screen.getByPlaceholderText(/lägg till slugg/i)).toBeInTheDocument()

    const planningTrigger = screen.getByRole('button', { name: /välj planering/i })
    await user.click(planningTrigger)
    await user.type(screen.getByRole('combobox'), 'pi')
    const option = await screen.findByRole('option', { name: /picked planning/i })
    await user.click(option)

    // Dialog still open (sanity check — option click can spuriously dismiss it under jsdom).
    expect(screen.getByPlaceholderText(/lägg till titel/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/lägg till slugg/i)).not.toBeInTheDocument()
  })

  // Driving handleCreate end-to-end (slugline-required toast, submitTimeless
  // rejection toast) requires picking category + newsvalue from sync
  // ComboBoxes; their option clicks bubble through the Radix dialog overlay
  // under jsdom and dismiss the parent dialog. Browser-mode tests against a
  // real engine would cover those branches; see `submitTimeless.test.ts` for
  // the rejection path coverage at the lib layer.
})
