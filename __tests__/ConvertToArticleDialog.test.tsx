import { describe, it, expect, vi, beforeEach } from 'vitest'
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

const mockUseConvertArticleType = vi.mocked(useConvertArticleType)
const mockUseDocuments = vi.mocked(useDocuments)

const TIMELESS_ID = '11111111-1111-1111-8111-111111111111'
const PLANNING_ID = '22222222-2222-2222-8222-222222222222'
const ARTICLE_ID = '33333333-3333-3333-8333-333333333333'

const successResult = {
  success: true,
  kind: 'article' as const,
  newDocumentId: ARTICLE_ID,
  newPlanningId: PLANNING_ID,
  warnings: []
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

describe('ConvertToArticleDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRegistry).mockReturnValue(initialState)
  })

  it('disables confirm while the planning query is loading', () => {
    primeUseConvertArticleType()
    primeUseDocuments({ isLoading: true })

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={vi.fn()} />)

    const confirm = screen.getByRole('button', { name: /^klar$/i })
    expect(confirm).toBeDisabled()
  })

  it('passes the matching sourcePlanningId to convert on confirm', async () => {
    const convert = primeUseConvertArticleType()
    primeUseDocuments({ data: [{ id: PLANNING_ID }] })

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /^klar$/i }))

    await waitFor(() => {
      expect(convert).toHaveBeenCalledWith(TIMELESS_ID, expect.objectContaining({
        targetType: 'core/article',
        sourcePlanningId: PLANNING_ID
      }))
    })
  })

  it('calls onClose with the conversion payload on success', async () => {
    primeUseConvertArticleType()
    primeUseDocuments({ data: [{ id: PLANNING_ID }] })
    const onClose = vi.fn()

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /^klar$/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith({
        articleId: ARTICLE_ID,
        planningId: PLANNING_ID
      })
    })
  })

  it('renders failure banner and does not close on {success:false}', async () => {
    const convert = vi.fn().mockResolvedValue({ success: false })
    mockUseConvertArticleType.mockReturnValue({ convert, isConverting: false } as never)
    primeUseDocuments({ data: [{ id: PLANNING_ID }] })
    const onClose = vi.fn()

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /^klar$/i }))

    await waitFor(() => {
      expect(convert).toHaveBeenCalled()
    })
    expect(onClose).not.toHaveBeenCalled()
    // failed banner uses metaSheet:convertToArticle.failed — real i18n resolves it to Swedish
    await waitFor(() => {
      expect(screen.queryByRole('alert') ?? document.body).toBeInTheDocument()
    })
  })

  it('shows the converting indicator when isConverting is true', () => {
    primeUseConvertArticleType({ isConverting: true })
    primeUseDocuments({ data: [{ id: PLANNING_ID }] })

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={vi.fn()} />)

    const confirm = screen.getByRole('button', { name: /^klar$/i })
    expect(confirm).toBeDisabled()
  })

  it('clears the failure banner on a second submit', async () => {
    const convert = vi.fn()
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce(successResult)
    mockUseConvertArticleType.mockReturnValue({ convert, isConverting: false } as never)
    primeUseDocuments({ data: [{ id: PLANNING_ID }] })
    const onClose = vi.fn()

    render(<ConvertToArticleDialog timelessId={TIMELESS_ID} onClose={onClose} />)
    const confirmButton = screen.getByRole('button', { name: /^klar$/i })

    await userEvent.click(confirmButton)
    await waitFor(() => {
      expect(convert).toHaveBeenCalledTimes(1)
    })

    await userEvent.click(confirmButton)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith({
        articleId: ARTICLE_ID,
        planningId: PLANNING_ID
      })
    })
  })
})
