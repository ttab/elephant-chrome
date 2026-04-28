import { render } from '@testing-library/react'
import { PromptSchedule } from '@/components/DocumentStatus/PromptSchedule'
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

let mockPublishDate: Date | undefined

vi.mock('@/modules/yjs/hooks', () => ({
  useYValue: () => [mockPublishDate]
}))

vi.mock('@/hooks/useCollaborationDocument', () => ({
  useCollaborationDocument: () => ({
    document: undefined,
    documentId: 'planning-1',
    connected: false,
    synced: false,
    loading: false
  })
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({ timeZone: 'Europe/Stockholm' })
}))

vi.mock('@/components/HastToggle', () => ({
  HastToggle: () => null
}))

const usablePrompt: { status: string } & WorkflowTransition = {
  status: 'usable',
  title: 'Schedule',
  promptTitle: 'Schedule publication',
  description: 'Pick a publication time'
}

const renderSchedule = () =>
  render(
    <PromptSchedule
      prompt={usablePrompt}
      planningId='planning-1'
      setStatus={vi.fn()}
      showPrompt={vi.fn()}
    />
  )

describe('PromptSchedule', () => {
  beforeEach(() => {
    mockPublishDate = undefined
  })

  it('renders without throwing when planning has no start_date and no embargo', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderSchedule()).not.toThrow()
    expect(document.getElementById('ScheduledTime')).toBeInTheDocument()
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
