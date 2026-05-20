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

describe('PromptSchedule locale-independence', () => {
  const NOW_ISO = '2026-05-17T12:00:00Z'

  beforeEach(() => {
    mockPublishDate = undefined
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW_ISO))
    // Force en-US-style locale output to surface the locale-string lex
    // compare bug regardless of host default locale. Capture the original
    // method before spying so the mock can delegate to it instead of
    // recursing into itself.
    const originalToLocaleString = Date.prototype.toLocaleString.bind(Date.prototype)
    vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function (this: Date) {
      return originalToLocaleString.call(this, 'en-US', { timeZone: 'UTC' })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('does not initialize the picker to a past planning date in en-US locale', () => {
    // Planning publish date is May 9 (past); today is May 17. In en-US the
    // sliced locale string "5/17/2026," lex-compares smaller than the full
    // locale string "5/9/2026, 12:00:00 PM" on the first differing digit,
    // tricking the old code into treating the past date as "future".
    mockPublishDate = new Date('2026-05-09T10:00:00Z')

    renderSchedule()

    // The Prompt component renders through a portal into document.body via
    // a Radix Dialog, so we read text content from the full document. The
    // schedule prompt renders the chosen planning date as yyyy-MM-dd. With
    // the bug it shows 2026-05-09 (the past publishDate); fixed it should
    // show today (2026-05-17).
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/2026-05-09/)
    expect(text).toMatch(/2026-05-17/)
  })
})
