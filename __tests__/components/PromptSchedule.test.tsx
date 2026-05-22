import { fireEvent, render, screen } from '@testing-library/react'
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

const renderSchedule = (overrides?: { embargoUntil?: string }) =>
  render(
    <PromptSchedule
      prompt={usablePrompt}
      planningId='planning-1'
      setStatus={vi.fn()}
      showPrompt={vi.fn()}
      embargoUntil={overrides?.embargoUntil}
    />
  )

const getTimeInput = () =>
  document.getElementById('ScheduledTime') as HTMLInputElement

const getPrimaryButton = () =>
  screen.getByRole('button', { name: usablePrompt.title })

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

  it('renders with no preselected time when no embargo is active', () => {
    renderSchedule()
    expect(getTimeInput().value).toBe('')
  })

  it('disables the primary button when no time has been picked', () => {
    renderSchedule()
    expect(getPrimaryButton()).toBeDisabled()
  })

  it('enables the primary button once a future time is picked', () => {
    renderSchedule()
    // Pick a date+time clearly in the future.
    const future = new Date(Date.now() + 60 * 60 * 1000)
    const hh = String(future.getHours()).padStart(2, '0')
    const mm = String(future.getMinutes()).padStart(2, '0')

    fireEvent.change(getTimeInput(), { target: { value: `${hh}:${mm}` } })

    expect(getPrimaryButton()).not.toBeDisabled()
  })

  it('keeps the primary button disabled if the picked time is in the past', () => {
    renderSchedule()
    const past = new Date(Date.now() - 60 * 60 * 1000)
    const hh = String(past.getHours()).padStart(2, '0')
    const mm = String(past.getMinutes()).padStart(2, '0')

    fireEvent.change(getTimeInput(), { target: { value: `${hh}:${mm}` } })

    expect(getPrimaryButton()).toBeDisabled()
  })

  it('shows a validation message when the picked time is in the past', () => {
    renderSchedule()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    const past = new Date(Date.now() - 60 * 60 * 1000)
    const hh = String(past.getHours()).padStart(2, '0')
    const mm = String(past.getMinutes()).padStart(2, '0')

    fireEvent.change(getTimeInput(), { target: { value: `${hh}:${mm}` } })

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('prefills the time when an active embargo is provided', () => {
    const futureEmbargo = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    renderSchedule({ embargoUntil: futureEmbargo })

    expect(getTimeInput().value).not.toBe('')
  })

  it('warns and blocks submit when the planning date is in the past', () => {
    mockPublishDate = new Date('2024-01-01T12:00:00Z')
    renderSchedule()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(getPrimaryButton()).toBeDisabled()
  })

  it('does not warn about past planning when the planning date is today or later', () => {
    mockPublishDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    renderSchedule()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
