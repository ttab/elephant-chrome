import { describe, it, expect } from 'vitest'
import { structureAssignments } from '@/hooks/index/lib/assignments/structureAssignments'
import type { AssignmentInterface } from '@/hooks/index/lib/assignments/types'

const TIMEZONE = 'Europe/Stockholm'

const SLOTS = [
  { key: 'morning', label: 'Morning', hours: [6, 7, 8, 9, 10, 11] },
  { key: 'afternoon', label: 'Afternoon', hours: [12, 13, 14, 15, 16, 17] },
  { key: 'evening', label: 'Evening', hours: [18, 19, 20, 21, 22, 23] }
]

function makeAssignment(opts: {
  id: string
  status: string
  publish?: string
  start?: string
  modified?: string
  hasUsable?: boolean
}): AssignmentInterface {
  const statusData = {
    heads: opts.hasUsable ? { usable: { id: `${opts.id}-usable` } } : {},
    modified: opts.modified ?? '',
    uuid: opts.id,
    version: '1',
    workflowState: '',
    workflowCheckpoint: ''
  }

  return {
    _id: opts.id,
    _deliverableStatus: opts.status,
    _statusData: JSON.stringify(statusData),
    data: {
      publish: opts.publish,
      start: opts.start
    }
  } as unknown as AssignmentInterface
}

function slotOf(result: ReturnType<typeof structureAssignments>, id: string) {
  return result.find((slot) => slot.items.some((item) => item._id === id))?.key
}

describe('structureAssignments', () => {
  it('buckets a withheld deliverable by its stored publish time', () => {
    // 08:00 UTC is 10:00 in Stockholm summer time -> morning slot
    const result = structureAssignments(TIMEZONE, [
      makeAssignment({ id: 'a', status: 'withheld', publish: '2026-06-23T08:00:00.000Z' })
    ], SLOTS)

    expect(slotOf(result, 'a')).toBe('morning')
  })

  it('ignores publish for a usable deliverable and falls back to the modified time', () => {
    // publish would bucket to morning, but usable must use the status modified time (evening)
    const result = structureAssignments(TIMEZONE, [
      makeAssignment({
        id: 'a',
        status: 'usable',
        publish: '2026-06-23T08:00:00.000Z',
        modified: '2026-06-23T20:00:00',
        hasUsable: true
      })
    ], SLOTS)

    expect(slotOf(result, 'a')).toBe('evening')
  })

  it('sorts a withheld (scheduled) deliverable before a usable one in the same slot', () => {
    const result = structureAssignments(TIMEZONE, [
      makeAssignment({
        id: 'usable',
        status: 'usable',
        publish: '2026-06-23T05:00:00.000Z',
        modified: '2026-06-23T09:00:00',
        hasUsable: true
      }),
      makeAssignment({ id: 'withheld', status: 'withheld', publish: '2026-06-23T08:00:00.000Z' })
    ], SLOTS)

    const morning = result.find((slot) => slot.key === 'morning')
    expect(morning?.items.map((item) => item._id)).toEqual(['withheld', 'usable'])
  })

  it('orders two withheld deliverables by ascending publish time', () => {
    const result = structureAssignments(TIMEZONE, [
      makeAssignment({ id: 'later', status: 'withheld', publish: '2026-06-23T09:00:00.000Z' }),
      makeAssignment({ id: 'earlier', status: 'withheld', publish: '2026-06-23T06:00:00.000Z' })
    ], SLOTS)

    const morning = result.find((slot) => slot.key === 'morning')
    expect(morning?.items.map((item) => item._id)).toEqual(['earlier', 'later'])
  })
})
