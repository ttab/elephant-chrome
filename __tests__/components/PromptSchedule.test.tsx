import { fireEvent, render, screen } from '@testing-library/react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { PromptSchedule } from '@/components/DocumentStatus/PromptSchedule'
import { DEFAULT_TIMEZONE } from '@/defaults/defaultTimezone'
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
let mockUserTimeZone = 'Europe/Stockholm'

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
  useRegistry: () => ({ timeZone: mockUserTimeZone })
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

// Format in DEFAULT_TIMEZONE because that is what the picker now interprets
// HH:mm in, regardless of the test runner's local timezone.
const toHHMM = (d: Date) =>
  format(toZonedTime(d, DEFAULT_TIMEZONE), 'HH:mm')

describe('PromptSchedule', () => {
  beforeEach(() => {
    mockPublishDate = undefined
    mockUserTimeZone = 'Europe/Stockholm'
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
    const future = new Date(Date.now() + 60 * 60 * 1000)

    fireEvent.change(getTimeInput(), { target: { value: toHHMM(future) } })

    expect(getPrimaryButton()).not.toBeDisabled()
  })

  it('keeps the primary button disabled if the picked time is in the past', () => {
    renderSchedule()
    const past = new Date(Date.now() - 60 * 60 * 1000)

    fireEvent.change(getTimeInput(), { target: { value: toHHMM(past) } })

    expect(getPrimaryButton()).toBeDisabled()
  })

  it('shows a validation message when the picked time is in the past', () => {
    renderSchedule()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    const past = new Date(Date.now() - 60 * 60 * 1000)
    fireEvent.change(getTimeInput(), { target: { value: toHHMM(past) } })

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('prefills the time when an active embargo is provided', () => {
    const futureEmbargo = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    renderSchedule({ embargoUntil: futureEmbargo })

    expect(getTimeInput().value).not.toBe('')
  })

  it('disables submit and shows an alert when the picked time is before an active embargo', () => {
    const embargo = new Date(Date.now() + 6 * 60 * 60 * 1000)
    renderSchedule({ embargoUntil: embargo.toISOString() })

    expect(getPrimaryButton()).not.toBeDisabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    const before = new Date(embargo.getTime() - 60 * 1000)
    fireEvent.change(getTimeInput(), { target: { value: toHHMM(before) } })

    expect(getPrimaryButton()).toBeDisabled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('passes the picked time to setStatus when the primary button is clicked', () => {
    const setStatus = vi.fn()
    render(
      <PromptSchedule
        prompt={usablePrompt}
        planningId='planning-1'
        setStatus={setStatus}
        showPrompt={vi.fn()}
      />
    )

    const future = new Date(Date.now() + 60 * 60 * 1000)
    fireEvent.change(getTimeInput(), { target: { value: toHHMM(future) } })

    fireEvent.click(screen.getByRole('button', { name: usablePrompt.title }))

    expect(setStatus).toHaveBeenCalledTimes(1)
    const [statusArg, payload]
      = setStatus.mock.calls[0] as [string, { time: Date, cause: undefined }]
    expect(statusArg).toBe(usablePrompt.status)
    expect(payload.time).toBeInstanceOf(Date)
    // Stored instant must read as the picked HH:mm in DEFAULT_TIMEZONE,
    // independent of the test runner's local timezone.
    expect(format(toZonedTime(payload.time, DEFAULT_TIMEZONE), 'HH:mm'))
      .toBe(toHHMM(future))
    expect(payload.cause).toBeUndefined()
  })

  it('schedules onto today when the planning start_date is in the past', () => {
    const setStatus = vi.fn()
    mockPublishDate = new Date('2024-01-01T12:00:00Z')
    render(
      <PromptSchedule
        prompt={usablePrompt}
        planningId='planning-1'
        setStatus={setStatus}
        showPrompt={vi.fn()}
      />
    )

    const future = new Date(Date.now() + 60 * 60 * 1000)
    fireEvent.change(getTimeInput(), { target: { value: toHHMM(future) } })

    expect(getPrimaryButton()).not.toBeDisabled()
    fireEvent.click(getPrimaryButton())

    const [, payload] = setStatus.mock.calls[0] as [string, { time: Date }]
    // Compare calendar day in DEFAULT_TIMEZONE so the assertion is stable
    // regardless of the test runner's local timezone.
    const stockholmToday = format(toZonedTime(new Date(), DEFAULT_TIMEZONE), 'yyyy-MM-dd')
    const stockholmStored = format(toZonedTime(payload.time, DEFAULT_TIMEZONE), 'yyyy-MM-dd')
    expect(stockholmStored).toBe(stockholmToday)
  })

  it('shows a timezone notice with offset when the user timezone differs from the system', () => {
    mockUserTimeZone = 'Asia/Kolkata'
    renderSchedule()

    expect(screen.getByText(/\+4h 30m|\+3h 30m/)).toBeInTheDocument()
  })

  it('does not show the timezone notice when the user is in the system timezone', () => {
    mockUserTimeZone = 'Europe/Stockholm'
    renderSchedule()

    expect(screen.queryByText(/offset|skillnad|forskjell/i)).not.toBeInTheDocument()
  })

  it('does not show the timezone notice when the user timezone shares the system offset', () => {
    mockUserTimeZone = 'Europe/Oslo'
    renderSchedule()

    expect(screen.queryByText(/offset|skillnad|forskjell/i)).not.toBeInTheDocument()
  })

  // Regression for the Sydney bureau case where browser-local setHours stored a
  // Sydney-zoned instant for a Stockholm-labelled HH:mm, so material went out
  // ~8h earlier than intended. The picker must interpret HH:mm in
  // DEFAULT_TIMEZONE, never browser-local.
  it('stores a Stockholm-zoned instant for picked HH:mm (Sydney bureau regression)', () => {
    // Pin "now" to 2026-05-26 00:00 UTC = 02:00 Stockholm (CEST) = 10:00 Sydney (AEST).
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-26T00:00:00Z'))

    try {
      const setStatus = vi.fn()
      render(
        <PromptSchedule
          prompt={usablePrompt}
          planningId='planning-1'
          setStatus={setStatus}
          showPrompt={vi.fn()}
        />
      )

      fireEvent.change(getTimeInput(), { target: { value: '15:00' } })
      expect(getPrimaryButton()).not.toBeDisabled()
      fireEvent.click(getPrimaryButton())

      const [, payload] = setStatus.mock.calls[0] as [string, { time: Date }]

      // Contract: 15:00 on 2026-05-26 in Stockholm (CEST) = 13:00 UTC.
      expect(payload.time.toISOString()).toBe('2026-05-26T13:00:00.000Z')

      // Regression: must not equal what browser-local setHours in Sydney (AEST,
      // +10) would have produced, which is 15:00 Sydney = 05:00 UTC.
      expect(payload.time.toISOString()).not.toBe('2026-05-26T05:00:00.000Z')
    } finally {
      vi.useRealTimers()
    }
  })
})
