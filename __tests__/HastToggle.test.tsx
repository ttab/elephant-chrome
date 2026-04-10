import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HastToggle } from '@/components/HastToggle'
import { Block } from '@ttab/elephant-api/newsdoc'
import type * as Y from 'yjs'
import type { YDocument } from '@/modules/yjs/hooks'

const mockSetHast = vi.fn()
let mockHastValue: Block | undefined = undefined

vi.mock('@/modules/yjs/hooks', () => ({
  useYValue: () => [mockHastValue, mockSetHast]
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({ featureFlags: { hasHast: true } })
}))

describe('HastToggle', () => {
  const mockYdoc = {
    id: 'test-doc',
    ele: {} as Y.Map<unknown>
  } as YDocument<Y.Map<unknown>>

  beforeEach(() => {
    mockHastValue = undefined
    mockSetHast.mockClear()
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

  it('removes hast block on toggle off', async () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '2' })
    const user = userEvent.setup()
    render(<HastToggle ydoc={mockYdoc} usableId={1n} />)

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(mockSetHast).toHaveBeenCalledWith(undefined)
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
})
