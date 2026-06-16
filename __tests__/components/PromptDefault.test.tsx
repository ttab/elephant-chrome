import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptDefault } from '@/components/DocumentStatus/PromptDefault'
import type { WorkflowTransition } from '@/defaults/workflowSpecification'

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
HTMLElement.prototype.hasPointerCapture = vi.fn()

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({ timeZone: 'Europe/Stockholm' })
}))

vi.mock('@/components/HastToggle', () => ({
  HastToggle: () => null
}))

const draftPrompt: { status: string } & WorkflowTransition = {
  status: 'draft',
  title: 'New version',
  promptTitle: 'New version of article',
  description: 'Continue working on a new version',
  verify: true
}

const renderPrompt = (props: Partial<Parameters<typeof PromptDefault>[0]> = {}) => {
  const setStatus = vi.fn()
  const showPrompt = vi.fn()

  render(
    <PromptDefault
      prompt={draftPrompt}
      setStatus={setStatus}
      showPrompt={showPrompt}
      requireCause
      {...props}
    />
  )

  return { setStatus, showPrompt, user: userEvent.setup() }
}

describe('PromptDefault', () => {
  it('defaults the cause to development (UV) when requireCause is true and no current cause', () => {
    renderPrompt()

    expect(screen.getByRole('combobox')).toHaveTextContent('UV')
  })

  it('does not pre-select a cause when requireCause is false', () => {
    renderPrompt({ requireCause: false })

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('uses the existing currentCause instead of the development default', () => {
    renderPrompt({ currentCause: 'fix' })

    expect(screen.getByRole('combobox')).toHaveTextContent('KORR')
  })

  it('submits with cause=development when accepted with the default', async () => {
    const { setStatus, user } = renderPrompt()

    await user.click(screen.getByRole('button', { name: 'New version' }))

    expect(setStatus).toHaveBeenCalledWith('draft', { cause: 'development' })
  })
})
