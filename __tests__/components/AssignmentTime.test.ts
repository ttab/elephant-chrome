import { describe, expect, it } from 'vitest'
import { deriveExecutionDates, getDateInDefaultTimeZone } from '@/components/AssignmentTime/utils'
import type { AssignmentData } from '@/components/AssignmentTime/types'

describe('AssignmentTime utils', () => {
  it('normalizes timestamps to DEFAULT_TIMEZONE dates', () => {
    const fallback: AssignmentData = {
      start_date: '2025-01-15',
      end_date: '2025-01-15'
    }

    const { startDateValue, endDateValue } = deriveExecutionDates(
      '2025-01-15T23:30:00.000Z',
      '2025-01-16T01:00:00.000Z',
      fallback
    )

    expect(startDateValue).toBe('2025-01-16')
    expect(endDateValue).toBe('2025-01-16')
  })

  it('falls back to start timestamp and existing data when needed', () => {
    const fallback: AssignmentData = {
      start_date: '2025-02-01',
      end_date: '2025-02-01'
    }

    const partial = deriveExecutionDates('2025-07-01T22:30:00.000Z', undefined, fallback)
    expect(partial.startDateValue).toBe('2025-07-02')
    expect(partial.endDateValue).toBe('2025-07-02')

    const noTimestamps = deriveExecutionDates(undefined, undefined, fallback)
    expect(noTimestamps.startDateValue).toBe('2025-02-01')
    expect(noTimestamps.endDateValue).toBe('2025-02-01')
  })

  it('returns undefined for invalid ISO strings', () => {
    expect(getDateInDefaultTimeZone('not-a-date')).toBeUndefined()
  })
})
