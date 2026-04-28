import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@ttab/elephant-ui'
import { StatusOptions } from '@/components/DocumentStatus/StatusOptions'
import { ClockIcon } from '@ttab/elephant-ui/icons'
import type { WorkflowTransition, StatusSpecification } from '@/defaults/workflowSpecification'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query as unknown,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = ResizeObserverMock
Element.prototype.scrollIntoView = vi.fn()

const withheldTransition: WorkflowTransition = {
  title: 'Schedule',
  description: 'Schedule publishing'
}
const usableTransition: WorkflowTransition = {
  title: 'Publish',
  description: 'Publish now'
}

const statuses: Record<string, StatusSpecification> = {
  withheld: { icon: ClockIcon, className: '' },
  usable: { icon: ClockIcon, className: '' }
}

const renderOptions = (disabledTransitions?: Record<string, { reason: string }>) => {
  const onSelect = vi.fn()
  const user = userEvent.setup()
  render(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <StatusOptions
          transitions={{ withheld: withheldTransition, usable: usableTransition }}
          statuses={statuses}
          onSelect={onSelect}
          documentType='core/article'
          disabledTransitions={disabledTransitions}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
  return { onSelect, user }
}

describe('StatusOptions', () => {
  it('renders all transitions as enabled by default', () => {
    renderOptions()

    const items = screen.getAllByRole('menuitem')
    expect(items).toHaveLength(2)
    items.forEach((item) => {
      expect(item).not.toHaveAttribute('data-disabled')
    })
  })

  it('marks a transition as disabled when disabledTransitions contains its key', () => {
    renderOptions({ withheld: { reason: 'Planning required' } })

    const items = screen.getAllByRole('menuitem')
    const withheldItem = items.find((el) => el.textContent?.includes('Schedule'))
    const usableItem = items.find((el) => el.textContent?.includes('Publish'))

    expect(withheldItem).toHaveAttribute('data-disabled')
    expect(usableItem).not.toHaveAttribute('data-disabled')
  })

  it('does not call onSelect when a disabled option is clicked', async () => {
    const { onSelect, user } = renderOptions({ withheld: { reason: 'Planning required' } })

    const withheldItem = screen.getAllByRole('menuitem')
      .find((el) => el.textContent?.includes('Schedule'))
    expect(withheldItem).toBeDefined()
    await user.click(withheldItem!)

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('calls onSelect when an enabled option is clicked', async () => {
    const { onSelect, user } = renderOptions({ withheld: { reason: 'Planning required' } })

    const usableItem = screen.getAllByRole('menuitem')
      .find((el) => el.textContent?.includes('Publish'))
    expect(usableItem).toBeDefined()
    await user.click(usableItem!)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ status: 'usable' }))
  })
})
