import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TFunction } from 'i18next'
import { updateAssignmentTime } from '@/lib/index/updateAssignmentPublishTime'

vi.mock('sonner', () => ({
  toast: { error: vi.fn() }
}))

const t = ((key: string) => key) as unknown as TFunction

function mockFetchOk(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue({
    status: 200,
    ok: true
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

function patchBody(fetchMock: ReturnType<typeof vi.fn>): {
  deliverableId: string
  type: string
  status: string
  time: string
} {
  const [, init] = fetchMock.mock.calls[0] as [string, { body: string }]
  return (JSON.parse(init.body) as {
    assignment: { deliverableId: string, type: string, status: string, time: string }
  }).assignment
}

describe('updateAssignmentTime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends the editorial-info link type so the planning assignment is found', async () => {
    const fetchMock = mockFetchOk()

    const ok = await updateAssignmentTime(
      'deliverable-1', 'planning-1', 'draft', new Date('2026-06-23T10:00:00Z'), 'core/editorial-info', t
    )

    expect(ok).toBe(true)
    expect(patchBody(fetchMock).type).toBe('core/editorial-info')
  })

  it('strips the #timeless variant down to the core/article link type', async () => {
    const fetchMock = mockFetchOk()

    await updateAssignmentTime(
      'deliverable-1', 'planning-1', 'draft', new Date('2026-06-23T10:00:00Z'), 'core/article#timeless', t
    )

    expect(patchBody(fetchMock).type).toBe('core/article')
  })

  it('falls back to core/article when no document type is provided', async () => {
    const fetchMock = mockFetchOk()

    await updateAssignmentTime(
      'deliverable-1', 'planning-1', 'draft', new Date('2026-06-23T10:00:00Z'), undefined, t
    )

    expect(patchBody(fetchMock).type).toBe('core/article')
  })
})
