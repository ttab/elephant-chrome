import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConvertToArticleDialog } from '@/components/ConvertToArticleDialog'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useDocuments } from '@/hooks/index/useDocuments'
import { useRegistry } from '@/hooks/useRegistry'
import { initialState } from '@/contexts/RegistryProvider'

vi.mock('@/hooks/useConvertArticleType', () => ({
  useConvertArticleType: vi.fn()
}))

vi.mock('@/hooks/index/useDocuments', () => ({
  useDocuments: vi.fn()
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: vi.fn()
}))

// The picker's planning search hits the index; stub it out.
vi.mock('@/lib/index/fetch-plannings-twirp', () => ({ fetch: vi.fn().mockResolvedValue([]) }))

const mockUseConvertArticleType = vi.mocked(useConvertArticleType)
const mockUseDocuments = vi.mocked(useDocuments)

// ComboBox/cmdk/vaul need these browser APIs that jsdom lacks.
global.ResizeObserver = class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
Element.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.hasPointerCapture = vi.fn()
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()

beforeAll(() => {
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
})

const TIMELESS_ID = '11111111-1111-1111-8111-111111111111'
const PLANNING_ID = '22222222-2222-2222-8222-222222222222'
const ARTICLE_ID = '33333333-3333-3333-8333-333333333333'

const successResult = {
  success: true,
  kind: 'article' as const,
  newDocumentId: ARTICLE_ID,
  newPlanningId: PLANNING_ID
}

function primeUseConvertArticleType(
  override?: Partial<ReturnType<typeof useConvertArticleType>>
): ReturnType<typeof vi.fn> {
  const convert = vi.fn().mockResolvedValue(successResult)
  mockUseConvertArticleType.mockReturnValue({
    convert,
    isConverting: false,
    ...override
  } as never)
  return convert
}

function primeUseDocuments(override?: {
  data?: Array<{ id: string }> | undefined
  isLoading?: boolean
}): void {
  mockUseDocuments.mockReturnValue({
    data: override?.data,
    isLoading: override?.isLoading ?? false
  } as never)
}

// Note: driving the planning ComboBox dropdown (open -> type -> click option)
// is not exercised here. Under jsdom the ComboBox renders as a vaul drawer and
// selecting an option dismisses the parent Prompt, so a follow-up confirm click
// can't be asserted (see the same caveat in TimelessCreation.test.tsx). The
// picker->convert contract is covered instead by the empty-default test below
// plus useConvertArticleType.test.tsx, which asserts a supplied targetPlanningId
// is forwarded to addAssignmentWithDeliverable.
describe('ConvertToArticleDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRegistry).mockReturnValue(initialState)
    primeUseDocuments({ data: [] })
  })

  it('disables confirm while the source-planning lookup is loading', () => {
    primeUseConvertArticleType()
    primeUseDocuments({ isLoading: true })

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: /^klar$/i })).toBeDisabled()
  })

  it('starts with no planning selected and passes targetPlanningId undefined', async () => {
    const convert = primeUseConvertArticleType()

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={vi.fn()} />)

    // No clear button visible means nothing is pre-selected.
    expect(screen.queryByRole('button', { name: /ta bort planering/i })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^klar$/i }))

    await waitFor(() => {
      expect(convert).toHaveBeenCalledWith(TIMELESS_ID, expect.objectContaining({
        targetType: 'core/article',
        targetPlanningId: undefined
      }))
    })
  })

  it('forwards the detected source planning as sourcePlanningId', async () => {
    const convert = primeUseConvertArticleType()
    primeUseDocuments({ data: [{ id: PLANNING_ID }] })

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /^klar$/i }))

    await waitFor(() => {
      expect(convert).toHaveBeenCalledWith(TIMELESS_ID, expect.objectContaining({
        sourcePlanningId: PLANNING_ID
      }))
    })
  })

  it('calls onClose with the conversion payload on success', async () => {
    primeUseConvertArticleType()
    const onClose = vi.fn()

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /^klar$/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith({ articleId: ARTICLE_ID, planningId: PLANNING_ID })
    })
  })

  it('renders failure banner and does not close on {success:false}', async () => {
    const convert = vi.fn().mockResolvedValue({ success: false })
    mockUseConvertArticleType.mockReturnValue({ convert, isConverting: false } as never)
    const onClose = vi.fn()

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /^klar$/i }))

    await waitFor(() => {
      expect(convert).toHaveBeenCalled()
    })
    expect(onClose).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByText(/kunde inte skapa det nya dokumentet/i)).toBeInTheDocument()
    })
  })

  it('shows the converting indicator when isConverting is true', () => {
    primeUseConvertArticleType({ isConverting: true })

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /sparar/i })).toBeDisabled()
  })

  it('clears the failure banner on a second submit', async () => {
    const convert = vi.fn()
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce(successResult)
    mockUseConvertArticleType.mockReturnValue({ convert, isConverting: false } as never)
    const onClose = vi.fn()

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={onClose} />)
    const confirmButton = screen.getByRole('button', { name: /^klar$/i })

    await userEvent.click(confirmButton)
    await waitFor(() => {
      expect(screen.getByText(/kunde inte skapa det nya dokumentet/i)).toBeInTheDocument()
    })

    await userEvent.click(confirmButton)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith({ articleId: ARTICLE_ID, planningId: PLANNING_ID })
    })
  })
})
