import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TFunction } from 'i18next'
import { updateAssignmentTime } from '@/lib/index/updateAssignmentPublishTime'

vi.mock('sonner')

const t = ((key: string) => key) as unknown as TFunction

function mockFetch(ok: boolean) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Internal Server Error'
  })
  global.fetch = fetchMock as unknown as typeof global.fetch
  return fetchMock
}

function bodyOf(fetchMock: ReturnType<typeof vi.fn>) {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  return (JSON.parse(init.body as string) as { assignment: Record<string, unknown> }).assignment
}

describe('updateAssignmentTime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('includes the publish time when scheduling (withheld)', async () => {
    const fetchMock = mockFetch(true)
    const time = new Date('2026-06-23T10:00:00.000Z')

    const result = await updateAssignmentTime('deliverable-1', 'planning-1', 'withheld', time, t)

    expect(result).toBe(true)
    expect(bodyOf(fetchMock)).toEqual({
      deliverableId: 'deliverable-1',
      type: 'core/article',
      status: 'withheld',
      time: '2026-06-23T10:00:00.000Z'
    })
  })

  it('omits the time entirely when clearing (leaving withheld)', async () => {
    const fetchMock = mockFetch(true)

    const result = await updateAssignmentTime('deliverable-1', 'planning-1', 'usable', undefined, t)

    expect(result).toBe(true)
    const body = bodyOf(fetchMock)
    expect(body).not.toHaveProperty('time')
    expect(body.status).toBe('usable')
  })

  it('returns false when the backend call fails', async () => {
    mockFetch(false)

    const result = await updateAssignmentTime('deliverable-1', 'planning-1', 'draft', undefined, t)

    expect(result).toBe(false)
  })
})
