import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Block } from '@ttab/elephant-api/newsdoc'

import { ConvertToTimelessDialog } from '@/components/ConvertToTimelessDialog'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'

vi.mock('@/hooks/useConvertArticleType', () => ({
  useConvertArticleType: vi.fn()
}))

vi.mock('@/components/TimelessCategory', () => ({
  TimelessCategorySelect: ({
    onChange
  }: {
    value: Block | undefined
    onChange: (category: Block) => void
  }) => (
    <button
      type='button'
      data-testid='pick-category'
      onClick={() => onChange(
        Block.create({ type: 'core/timeless-category', uuid: 'cat-1' })
      )}
    >
      pick
    </button>
  )
}))

const mockUseConvertArticleType = vi.mocked(useConvertArticleType)

const ARTICLE_ID = '11111111-1111-1111-8111-111111111111'
const TIMELESS_ID = '22222222-2222-2222-8222-222222222222'

describe('ConvertToTimelessDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders failure banner when convert rejects', async () => {
    const convert = vi.fn().mockRejectedValue(new Error('network'))
    mockUseConvertArticleType.mockReturnValue({
      convert,
      isConverting: false
    } as never)
    const onClose = vi.fn()

    render(<ConvertToTimelessDialog articleId={ARTICLE_ID} onClose={onClose} />)
    await userEvent.click(screen.getByTestId('pick-category'))
    await userEvent.click(screen.getByRole('button', { name: /^klar$/i }))

    await waitFor(() => {
      expect(convert).toHaveBeenCalled()
    })
    expect(onClose).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(
        screen.getByText(/kunde inte skapa det nya dokumentet/i)
      ).toBeInTheDocument()
    })
  })

  it('renders failure banner on {success:false}', async () => {
    const convert = vi.fn().mockResolvedValue({ success: false })
    mockUseConvertArticleType.mockReturnValue({
      convert,
      isConverting: false
    } as never)
    const onClose = vi.fn()

    render(<ConvertToTimelessDialog articleId={ARTICLE_ID} onClose={onClose} />)
    await userEvent.click(screen.getByTestId('pick-category'))
    await userEvent.click(screen.getByRole('button', { name: /^klar$/i }))

    await waitFor(() => {
      expect(convert).toHaveBeenCalled()
    })
    expect(onClose).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(
        screen.getByText(/kunde inte skapa det nya dokumentet/i)
      ).toBeInTheDocument()
    })
  })

  it('calls onClose with timelessId on success', async () => {
    const convert = vi.fn().mockResolvedValue({
      success: true,
      kind: 'timeless',
      newDocumentId: TIMELESS_ID,
      warnings: []
    })
    mockUseConvertArticleType.mockReturnValue({
      convert,
      isConverting: false
    } as never)
    const onClose = vi.fn()

    render(<ConvertToTimelessDialog articleId={ARTICLE_ID} onClose={onClose} />)
    await userEvent.click(screen.getByTestId('pick-category'))
    await userEvent.click(screen.getByRole('button', { name: /^klar$/i }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith({ timelessId: TIMELESS_ID })
    })
  })
})
