import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as Y from 'yjs'
import type { ReactNode } from 'react'
import type * as ElephantUi from '@ttab/elephant-ui'
import i18n from 'i18next'
import { TimeSelectItem } from '@/components/AssignmentTime/TimeSelectItem'

vi.mock('@/modules/yjs/hooks', () => ({
  useYValue: () => [undefined, vi.fn()]
}))

// Replace cmdk's CommandItem with a deterministic surrogate so we can drive
// onSelect directly without depending on cmdk's filtering/focus lifecycle.
// CommandItem in real cmdk calls onSelect with the value prop; reproduce that.
vi.mock('@ttab/elephant-ui', async (original) => {
  const actual = await original<typeof ElephantUi>()
  return {
    ...actual,
    CommandItem: ({
      value,
      onSelect,
      children
    }: {
      value?: string
      onSelect?: (value: string) => void
      children: ReactNode
    }) => (
      <div>
        <button
          data-testid='cmd-item'
          data-value={value}
          onClick={() => onSelect?.(value ?? '')}
        >
          {value}
        </button>
        {children}
      </div>
    ),
    Command: ({ children }: { children: ReactNode }) => <div>{children}</div>
  }
})

const mockAssignment = {} as Y.Map<unknown>

describe('TimeSelectItem - onSelect comparison must match across locales', () => {
  afterEach(async () => {
    await i18n.changeLanguage('sv')
  })

  it('opens the inner TimeInput in English (does not close parent) when "Select time" is selected', async () => {
    await i18n.changeLanguage('en')

    const handleOnSelect = vi.fn()
    const handleParentOpenChange = vi.fn()

    render(
      <TimeSelectItem
        assignment={mockAssignment}
        handleOnSelect={handleOnSelect}
        handleParentOpenChange={handleParentOpenChange}
      />
    )

    await userEvent.click(screen.getByTestId('cmd-item'))

    // When the user picks the "Select time" entry, the component should toggle
    // the inner TimeInput (setOpen) and NOT close the parent popover.
    expect(handleParentOpenChange).not.toHaveBeenCalled()
  })

  it('opens the inner TimeInput in Swedish (regression guard)', async () => {
    await i18n.changeLanguage('sv')

    const handleOnSelect = vi.fn()
    const handleParentOpenChange = vi.fn()

    render(
      <TimeSelectItem
        assignment={mockAssignment}
        handleOnSelect={handleOnSelect}
        handleParentOpenChange={handleParentOpenChange}
      />
    )

    await userEvent.click(screen.getByTestId('cmd-item'))

    expect(handleParentOpenChange).not.toHaveBeenCalled()
  })
})
