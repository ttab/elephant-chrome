import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HastToggle } from '@/components/HastToggle'
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

describe('HastToggle', () => {
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

  it('renders unchecked when hast meta is absent', () => {
    render(<HastToggle ydoc={mockYdoc} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('renders checked when hast targets a future version', () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '1' })
    render(<HastToggle ydoc={mockYdoc} usableId={0n} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('renders unchecked when hast targets the current version (already published)', () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '1' })
    render(<HastToggle ydoc={mockYdoc} usableId={1n} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('renders unchecked when hast targets a past version', () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '1' })
    render(<HastToggle ydoc={mockYdoc} usableId={3n} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('renders unchecked when hast value is far ahead of usableId', () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '100' })
    render(<HastToggle ydoc={mockYdoc} usableId={2n} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('sets hast block with incremented usable ID on toggle on', async () => {
    const user = userEvent.setup()
    render(<HastToggle ydoc={mockYdoc} usableId={2n} />)

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(mockSetHast).toHaveBeenCalledWith(
      Block.create({
        type: 'ntb/hast',
        value: '3'
      })
    )
  })

  it('sets hast value to 1 when usableId is undefined', async () => {
    const user = userEvent.setup()
    render(<HastToggle ydoc={mockYdoc} />)

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(mockSetHast).toHaveBeenCalledWith(
      Block.create({
        type: 'ntb/hast',
        value: '1'
      })
    )
  })

  it('removes from version directly on toggle off', async () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '2' })
    const user = userEvent.setup()
    render(<HastToggle ydoc={mockYdoc} usableId={1n} />)

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(mockSetHast).toHaveBeenCalledWith(
      Block.create({ type: 'ntb/hast', value: '0' })
    )
  })

  it('sets hast to next version when toggling on after previous hast was consumed', async () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '1' })
    const user = userEvent.setup()
    render(<HastToggle ydoc={mockYdoc} usableId={1n} />)

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(mockSetHast).toHaveBeenCalledWith(
      Block.create({ type: 'ntb/hast', value: '2' })
    )
  })

  it('renders full variant with label and description', () => {
    render(<HastToggle ydoc={mockYdoc} variant='full' />)

    expect(screen.getByText('Skicka som HAST')).toBeDefined()
    expect(screen.getByText(/Vid publicering/)).toBeDefined()
    expect(screen.getByRole('switch')).toBeDefined()
  })

  it('calls snapshotDocument after toggling on', async () => {
    const user = userEvent.setup()
    render(<HastToggle ydoc={mockYdoc} usableId={2n} />)

    await user.click(screen.getByRole('switch'))

    expect(mockSnapshotDocument).toHaveBeenCalledWith(
      'test-doc',
      {},
      undefined
    )
  })

  it('calls snapshotDocument after removing from version', async () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '2' })
    const user = userEvent.setup()
    render(<HastToggle ydoc={mockYdoc} usableId={1n} />)

    await user.click(screen.getByRole('switch'))

    expect(mockSnapshotDocument).toHaveBeenCalled()
  })

  it('shows error toast when snapshot fails', async () => {
    mockSnapshotDocument.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<HastToggle ydoc={mockYdoc} usableId={2n} />)

    await user.click(screen.getByRole('switch'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('removes from version directly in full variant', async () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '2' })
    const user = userEvent.setup()
    render(<HastToggle ydoc={mockYdoc} usableId={1n} variant='full' />)

    await user.click(screen.getByRole('switch'))

    expect(screen.queryByText('Den här versionen')).toBeNull()
    expect(mockSetHast).toHaveBeenCalledWith(
      Block.create({ type: 'ntb/hast', value: '0' })
    )
  })

  it('renders nothing when hasHast feature flag is false', () => {
    mockHasHastFlag = false
    const { container } = render(<HastToggle ydoc={mockYdoc} />)

    expect(container.firstChild).toBeNull()
  })

  it('handles invalid hast value gracefully', () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: 'not-a-number' })
    render(<HastToggle ydoc={mockYdoc} usableId={1n} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })
})
