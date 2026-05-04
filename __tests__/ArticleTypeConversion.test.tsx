import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'

import { ArticleTypeConversion } from '@/components/ArticleTypeConversion'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useLink } from '@/hooks/useLink'
import { useModal } from '@/components/Modal/useModal'
import type * as Y from 'yjs'
import type { YDocument } from '@/modules/yjs/hooks'

vi.mock('@/hooks/useConvertArticleType', () => ({
  useConvertArticleType: vi.fn()
}))

vi.mock('@/hooks/useLink', () => ({
  useLink: vi.fn()
}))

vi.mock('@/components/Modal/useModal', () => ({
  useModal: vi.fn()
}))

vi.mock('@/components/ConvertToArticleDialog', () => ({
  ConvertToArticleDialog: () => null
}))

vi.mock('@/components/ConvertToTimelessDialog', () => ({
  ConvertToTimelessDialog: () => null
}))

const mockUseConvertArticleType = vi.mocked(useConvertArticleType)
const mockUseLink = vi.mocked(useLink)
const mockUseModal = vi.mocked(useModal)

const mockYdoc = {
  id: 'doc-id',
  ele: {} as Y.Map<unknown>
} as YDocument<Y.Map<unknown>>

interface DialogProps {
  timelessId?: string
  articleId?: string
  onClose: (result?: { articleId?: string, planningId?: string, timelessId?: string }) => void
}

function setup() {
  const openEditor = vi.fn()
  const showModal = vi.fn()
  const hideModal = vi.fn()

  mockUseConvertArticleType.mockReturnValue({ isConverting: false } as never)
  mockUseLink.mockReturnValue(openEditor)
  mockUseModal.mockReturnValue({ showModal, hideModal } as never)

  return { openEditor, showModal, hideModal }
}

function getDialogOnClose(showModal: ReturnType<typeof vi.fn>): DialogProps['onClose'] {
  const node = showModal.mock.calls[0][0] as ReactElement<DialogProps>
  return node.props.onClose
}

describe('ArticleTypeConversion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for non-article document types', () => {
    setup()
    const { container } = render(
      <ArticleTypeConversion ydoc={mockYdoc} documentType='core/planning-item' />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the convert-to-article button when document is timeless', () => {
    setup()
    render(<ArticleTypeConversion ydoc={mockYdoc} documentType='core/article#timeless' />)
    expect(screen.getByRole('button', { name: /artikel/i })).toBeInTheDocument()
  })

  it('renders the convert-to-timeless button when document is an article', () => {
    setup()
    render(<ArticleTypeConversion ydoc={mockYdoc} documentType='core/article' />)
    expect(screen.getByRole('button', { name: /tidlös/i })).toBeInTheDocument()
  })

  it('opens the new article in the source slot (target=self) after timeless→article conversion', async () => {
    const { openEditor, showModal } = setup()
    render(<ArticleTypeConversion ydoc={mockYdoc} documentType='core/article#timeless' />)

    await userEvent.click(screen.getByRole('button'))
    expect(showModal).toHaveBeenCalledTimes(1)

    const onClose = getDialogOnClose(showModal)
    onClose({ articleId: 'new-article-id', planningId: 'plan-id' })

    expect(openEditor).toHaveBeenCalledWith(undefined, { id: 'new-article-id' }, 'self')
  })

  it('opens the new timeless in the source slot (target=self) after article→timeless conversion', async () => {
    const { openEditor, showModal } = setup()
    render(<ArticleTypeConversion ydoc={mockYdoc} documentType='core/article' />)

    await userEvent.click(screen.getByRole('button'))
    expect(showModal).toHaveBeenCalledTimes(1)

    const onClose = getDialogOnClose(showModal)
    onClose({ timelessId: 'new-timeless-id' })

    expect(openEditor).toHaveBeenCalledWith(undefined, { id: 'new-timeless-id' }, 'self')
  })

  it('hides the modal but does not navigate when the dialog is dismissed without a result', async () => {
    const { openEditor, showModal, hideModal } = setup()
    render(<ArticleTypeConversion ydoc={mockYdoc} documentType='core/article#timeless' />)

    await userEvent.click(screen.getByRole('button'))
    const onClose = getDialogOnClose(showModal)
    onClose()

    expect(hideModal).toHaveBeenCalled()
    expect(openEditor).not.toHaveBeenCalled()
  })

  it('disables both convert buttons while a conversion is in progress', () => {
    const openEditor = vi.fn()
    const showModal = vi.fn()
    const hideModal = vi.fn()
    mockUseConvertArticleType.mockReturnValue({ isConverting: true } as never)
    mockUseLink.mockReturnValue(openEditor)
    mockUseModal.mockReturnValue({ showModal, hideModal } as never)

    render(<ArticleTypeConversion ydoc={mockYdoc} documentType='core/article#timeless' />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
