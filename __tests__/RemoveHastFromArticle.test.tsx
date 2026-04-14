import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RemoveHastFromArticle } from '@/components/RemoveHastFromArticle'
import { Block } from '@ttab/elephant-api/newsdoc'
import { toast } from 'sonner'
import type * as Y from 'yjs'
import type { YDocument } from '@/modules/yjs/hooks'

const mockSetHast = vi.fn()
const mockSnapshotDocument = vi.fn()
let mockHastValue: Block | undefined = undefined
let mockHasHastFlag = true

vi.mock('sonner')

vi.mock('@/lib/snapshotDocument', () => ({
  snapshotDocument: (...args: unknown[]) => mockSnapshotDocument(...args)
}))

vi.mock('@/modules/yjs/hooks', () => ({
  useYValue: () => [mockHastValue, mockSetHast]
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({ featureFlags: { hasHast: mockHasHastFlag } })
}))

describe('RemoveHastFromArticle', () => {
  const mockYdoc = {
    id: 'test-doc',
    ele: {} as Y.Map<unknown>
  } as YDocument<Y.Map<unknown>>

  beforeEach(() => {
    mockHastValue = undefined
    mockHasHastFlag = true
    mockSetHast.mockClear()
    mockSnapshotDocument.mockClear()
    mockSnapshotDocument.mockResolvedValue(undefined)
    vi.mocked(toast.error).mockClear()
  })

  it('renders nothing when hast meta is absent', () => {
    const { container } = render(<RemoveHastFromArticle ydoc={mockYdoc} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when hasHast feature flag is false', () => {
    mockHasHastFlag = false
    mockHastValue = Block.create({ type: 'ntb/hast', value: '1' })
    const { container } = render(<RemoveHastFromArticle ydoc={mockYdoc} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders button when hast is present', () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '1' })
    render(<RemoveHastFromArticle ydoc={mockYdoc} />)
    expect(screen.getByRole('button')).toBeDefined()
    expect(screen.getByText('Ta bort HAST från artikeln')).toBeDefined()
  })

  it('shows confirmation prompt when button clicked', async () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '2' })
    const user = userEvent.setup()
    render(<RemoveHastFromArticle ydoc={mockYdoc} />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText(/Detta tar bort HAST/)).toBeDefined()
  })

  it('removes hast from article when confirmed', async () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '2' })
    const user = userEvent.setup()
    render(<RemoveHastFromArticle ydoc={mockYdoc} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Ta bort'))

    expect(mockSetHast).toHaveBeenCalledWith(undefined)
  })

  it('calls snapshotDocument after removing', async () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '2' })
    const user = userEvent.setup()
    render(<RemoveHastFromArticle ydoc={mockYdoc} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Ta bort'))

    await waitFor(() => {
      expect(mockSnapshotDocument).toHaveBeenCalledWith(
        'test-doc',
        {},
        undefined
      )
    })
  })

  it('closes prompt without changes when cancel clicked', async () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '2' })
    const user = userEvent.setup()
    render(<RemoveHastFromArticle ydoc={mockYdoc} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Avbryt'))

    expect(mockSetHast).not.toHaveBeenCalled()
  })

  it('shows error toast when snapshot fails', async () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '2' })
    mockSnapshotDocument.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<RemoveHastFromArticle ydoc={mockYdoc} />)

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Ta bort'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })
})
