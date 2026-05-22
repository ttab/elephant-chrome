import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, type ReactElement } from 'react'

import { TimelessRowActions } from '@/views/TimelessOverview/lib/TimelessRowActions'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useDeliverableInfo } from '@/hooks/useDeliverableInfo'
import { useLink } from '@/hooks/useLink'
import { useModal } from '@/components/Modal/useModal'

vi.mock('@/hooks/useConvertArticleType', () => ({
  useConvertArticleType: vi.fn()
}))

vi.mock('@/hooks/useDeliverableInfo', () => ({
  useDeliverableInfo: vi.fn()
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

vi.mock('@/components/ui/DotMenu', () => ({
  DotMenu: ({ items, onOpenChange }: {
    items: Array<{
      label: string
      disabled?: boolean
      item: (event: React.MouseEvent<HTMLDivElement>) => void
    }>
    onOpenChange?: (open: boolean) => void
  }) => {
    // Simulate the menu being opened so any lazy-mounted hooks inside the
    // component flip to their "opened" state. Fire after commit to avoid
    // updating the parent during this component's render.
    useEffect(() => {
      onOpenChange?.(true)
    }, [onOpenChange])
    return (
      <div>
        {items.map((item) => (
          <button
            key={item.label}
            data-testid={`menu-${item.label}`}
            disabled={item.disabled}
            onClick={(event) => {
              if (typeof item.item === 'function') {
                item.item(event as unknown as React.MouseEvent<HTMLDivElement>)
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    )
  }
}))

const mockUseConvertArticleType = vi.mocked(useConvertArticleType)
const mockUseDeliverableInfo = vi.mocked(useDeliverableInfo)
const mockUseLink = vi.mocked(useLink)
const mockUseModal = vi.mocked(useModal)

interface DialogProps {
  timelessId: string
  onClose: (result?: { planningId?: string, articleId?: string }) => void
}

function setup({
  planningId = 'existing-plan-id',
  isConverting = false
}: { planningId?: string, isConverting?: boolean } = {}) {
  const openPlanning = vi.fn()
  const showModal = vi.fn()
  const hideModal = vi.fn()

  mockUseConvertArticleType.mockReturnValue({ isConverting } as never)
  mockUseDeliverableInfo.mockReturnValue({ planningUuid: planningId } as never)
  mockUseLink.mockReturnValue(openPlanning)
  mockUseModal.mockReturnValue({ showModal, hideModal } as never)

  return { openPlanning, showModal, hideModal }
}

function getDialogOnClose(showModal: ReturnType<typeof vi.fn>): DialogProps['onClose'] {
  const node = showModal.mock.calls[0][0] as ReactElement<DialogProps>
  return node.props.onClose
}

describe('TimelessRowActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens Planning (not Editor) with the new planning id after conversion succeeds', async () => {
    const { openPlanning, showModal } = setup()
    render(<TimelessRowActions documentId='timeless-id' />)

    await userEvent.click(screen.getByTestId(/^menu-Planera/i))
    expect(showModal).toHaveBeenCalledTimes(1)

    const onClose = getDialogOnClose(showModal)
    onClose({ planningId: 'new-plan-id', articleId: 'new-article-id' })

    expect(mockUseLink).toHaveBeenCalledWith('Planning')
    expect(openPlanning).toHaveBeenCalledWith(undefined, { id: 'new-plan-id' })
  })

  it('does not navigate when the dialog is dismissed without a planning id', async () => {
    const { openPlanning, showModal, hideModal } = setup()
    render(<TimelessRowActions documentId='timeless-id' />)

    await userEvent.click(screen.getByTestId(/^menu-Planera/i))
    const onClose = getDialogOnClose(showModal)
    onClose()

    expect(hideModal).toHaveBeenCalled()
    expect(openPlanning).not.toHaveBeenCalled()
  })

  it('opens the existing planning from the open-planning menu item', async () => {
    const { openPlanning } = setup({ planningId: 'existing-plan-id' })
    render(<TimelessRowActions documentId='timeless-id' />)

    await userEvent.click(screen.getByTestId(/^menu-Öppna/i))

    expect(openPlanning).toHaveBeenCalledWith(undefined, { id: 'existing-plan-id' })
  })

  it('disables the open-planning item when no planning is associated', () => {
    setup({ planningId: '' })
    render(<TimelessRowActions documentId='timeless-id' />)

    expect(screen.getByTestId(/^menu-Öppna/i)).toBeDisabled()
  })

  it('disables the convert item when status is "used"', () => {
    setup()
    render(<TimelessRowActions documentId='timeless-id' status='used' />)

    expect(screen.getByTestId(/^menu-Planera/i)).toBeDisabled()
  })

  it('disables the convert item while a conversion is in progress', () => {
    setup({ isConverting: true })
    render(<TimelessRowActions documentId='timeless-id' />)

    expect(screen.getByTestId(/^menu-Planera/i)).toBeDisabled()
  })

  it('defers the deliverable-info fetch until the menu has been opened', () => {
    setup()
    render(<TimelessRowActions documentId='timeless-id' />)

    // The DotMenu mock simulates an open by firing onOpenChange(true) on
    // render. The first invocation of the hook (before the open propagates)
    // must therefore be with an empty deliverableId, and the subsequent
    // invocation with the real id.
    expect(mockUseDeliverableInfo.mock.calls[0]?.[0]).toBe('')
    expect(mockUseDeliverableInfo.mock.calls.at(-1)?.[0]).toBe('timeless-id')
  })
})
