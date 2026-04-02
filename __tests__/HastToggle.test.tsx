import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HastToggle } from '@/components/HastToggle'
import { Block } from '@ttab/elephant-api/newsdoc'
import type * as Y from 'yjs'

const mockSetHast = vi.fn()
let mockHastValue: Block | undefined = undefined

vi.mock('@/modules/yjs/hooks', () => ({
  useYValue: () => [mockHastValue, mockSetHast]
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({ featureFlags: { hasHast: true } })
}))

describe('HastToggle', () => {
  const mockEle = {} as Y.Map<unknown>

  beforeEach(() => {
    mockHastValue = undefined
    mockSetHast.mockClear()
  })

  it('renders unchecked when hast meta is absent', () => {
    render(<HastToggle ele={mockEle} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('renders checked when hast meta is present', () => {
    mockHastValue = Block.create({ type: 'ntb/hast', value: '1' })
    render(<HastToggle ele={mockEle} />)

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('sets hast block with incremented usable ID on toggle on', async () => {
    const user = userEvent.setup()
    render(<HastToggle ele={mockEle} usableId={2n} />)

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
    render(<HastToggle ele={mockEle} />)

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
    mockHastValue = Block.create({ type: 'ntb/hast', value: '1' })
    const user = userEvent.setup()
    render(<HastToggle ele={mockEle} />)

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(mockSetHast).toHaveBeenCalledWith(undefined)
  })

  it('renders full variant with label and description', () => {
    render(<HastToggle ele={mockEle} variant='full' />)

    expect(screen.getByText('Skicka som hast')).toBeDefined()
    expect(screen.getByText(/Vid publicering/)).toBeDefined()
    expect(screen.getByRole('switch')).toBeDefined()
  })
})
