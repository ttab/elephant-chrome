import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HastToggle } from '@/components/HastToggle'
import { Block } from '@ttab/elephant-api/newsdoc'
import type * as Y from 'yjs'

const mockSetHast = vi.fn()
let mockHastValue: Block | undefined = undefined

vi.mock('@/modules/yjs/hooks', () => ({
  useYValue: vi.fn(() => [mockHastValue, mockSetHast])
}))

describe('HastToggle', () => {
  const mockEle = {} as Y.Map<unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    mockHastValue = undefined
  })

  it('renders unpressed when ntb/hast meta is absent', () => {
    render(<HastToggle ele={mockEle} usableId={0n} />)
    const toggle = screen.getByRole('button', { name: /hast/i })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders pressed when ntb/hast meta is present', () => {
    mockHastValue = Block.create({ type: 'ntb/hast', data: { value: '1' } })
    render(<HastToggle ele={mockEle} usableId={0n} />)
    const toggle = screen.getByRole('button', { name: /hast/i })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('sets ntb/hast block with next usable id when toggled on', async () => {
    const user = userEvent.setup()
    render(<HastToggle ele={mockEle} usableId={3n} />)

    const toggle = screen.getByRole('button', { name: /hast/i })
    await user.click(toggle)

    expect(mockSetHast).toHaveBeenCalledOnce()
    const arg = mockSetHast.mock.calls[0][0] as Block
    expect(arg.type).toBe('ntb/hast')
    expect(arg.data).toEqual({ value: '4' })
  })

  it('sets ntb/hast value to 1 when usableId is undefined (new article)', async () => {
    const user = userEvent.setup()
    render(<HastToggle ele={mockEle} usableId={undefined} />)

    const toggle = screen.getByRole('button', { name: /hast/i })
    await user.click(toggle)

    expect(mockSetHast).toHaveBeenCalledOnce()
    const arg = mockSetHast.mock.calls[0][0] as Block
    expect(arg.type).toBe('ntb/hast')
    expect(arg.data).toEqual({ value: '1' })
  })

  it('removes ntb/hast block when toggled off', async () => {
    mockHastValue = Block.create({ type: 'ntb/hast', data: { value: '1' } })
    const user = userEvent.setup()
    render(<HastToggle ele={mockEle} usableId={0n} />)

    const toggle = screen.getByRole('button', { name: /hast/i })
    await user.click(toggle)

    expect(mockSetHast).toHaveBeenCalledWith(undefined)
  })
})
