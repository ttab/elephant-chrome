import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as Y from 'yjs'
import type { ReactNode } from 'react'
import type * as ElephantUi from '@ttab/elephant-ui'
import { AssignmentType } from '@/components/DataItem/AssignmentType'

const setAssignmentTypeMock = vi.fn()
const setAssignmentVisibilityMock = vi.fn()

vi.mock('@/modules/yjs/hooks', () => ({
  useYValue: (_doc: unknown, path: string) => {
    if (path === 'meta.core/assignment-type') {
      return [[], setAssignmentTypeMock]
    }
    if (path === 'data.public') {
      return [undefined, setAssignmentVisibilityMock]
    }
    return [undefined, vi.fn()]
  }
}))

vi.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ hasHast: false })
}))

// Replace the Radix Select with a deterministic surrogate so we can drive
// onValueChange directly without depending on the popover/portal lifecycle.
vi.mock('@ttab/elephant-ui', async (original) => {
  const actual = await original<typeof ElephantUi>()
  return {
    ...actual,
    Select: ({ onValueChange, children }: {
      onValueChange?: (value: string) => void
      children: ReactNode
    }) => (
      <div>
        <button data-testid='pick-text' onClick={() => onValueChange?.('text')}>text</button>
        <button data-testid='pick-flash' onClick={() => onValueChange?.('flash')}>flash</button>
        <button data-testid='pick-timeless' onClick={() => onValueChange?.('timeless')}>timeless</button>
        {children}
      </div>
    ),
    SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectItem: ({ children }: { children: ReactNode }) => <>{children}</>
  }
})

const mockAssignment = {} as Y.Map<unknown>

describe('AssignmentType dropdown - data.public side effect', () => {
  beforeEach(() => {
    setAssignmentTypeMock.mockClear()
    setAssignmentVisibilityMock.mockClear()
  })

  it('flips data.public to "false" when timeless is selected', async () => {
    render(<AssignmentType assignment={mockAssignment} editable />)
    await userEvent.click(screen.getByTestId('pick-timeless'))
    expect(setAssignmentVisibilityMock).toHaveBeenCalledWith('false')
  })

  it('flips data.public to "false" when flash is selected (regression guard)', async () => {
    render(<AssignmentType assignment={mockAssignment} editable />)
    await userEvent.click(screen.getByTestId('pick-flash'))
    expect(setAssignmentVisibilityMock).toHaveBeenCalledWith('false')
  })

  it('does not touch data.public when text is selected', async () => {
    render(<AssignmentType assignment={mockAssignment} editable />)
    await userEvent.click(screen.getByTestId('pick-text'))
    expect(setAssignmentVisibilityMock).not.toHaveBeenCalled()
  })
})
