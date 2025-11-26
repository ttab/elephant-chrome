import { describe, expect, it, vi } from 'vitest'
import {
  deriveExecutionDates,
  getDateInDefaultTimeZone,
  getMedianSlot,
  getMidnightISOString,
  getTimeSlot,
  makeLocalString
} from '@/components/AssignmentTime/utils'
import type { AssignmentData, AssignmentValueOption } from '@/components/AssignmentTime/types'

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

  it('selects the correct time slot for a given slot identifier', () => {
    const options: AssignmentValueOption[] = [
      { label: 'Morning', value: 'morning', slots: ['08:00', '09:00'] },
      { label: 'Evening', value: 'evening', slots: ['18:00'] }
    ]

    const morningSlot = getTimeSlot('08:00', options)
    expect(morningSlot?.value).toBe('morning')

    const missingSlot = getTimeSlot('12:00', options)
    expect(missingSlot).toBeUndefined()
  })

  it('returns the configured median for a slot or -1 when absent', () => {
    const slots: AssignmentValueOption[] = [
      { label: 'Night', value: 'night', median: '02:00' },
      { label: 'Day', value: 'day', median: '12:00' }
    ]

    expect(getMedianSlot(slots, 'day')).toBe('12:00')
    expect(getMedianSlot(slots, 'unknown')).toBe('-1')
  })

  it('builds an ISO string anchored at local midnight', () => {
    const result = getMidnightISOString('2025-05-01')
    const expected = new Date('2025-05-01T00:00:00').toISOString()

    expect(result).toBe(expected)
  })

  it('formats execution timestamps with sv-SE locale 2-digit time', () => {
    const toLocaleSpy = vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('08:45')

    const formatted = makeLocalString('2025-05-01T06:45:00.000Z')

    expect(formatted).toBe('08:45')
    expect(toLocaleSpy).toHaveBeenCalledWith('sv-SE', { hour: '2-digit', minute: '2-digit' })

    toLocaleSpy.mockRestore()
  })
})
