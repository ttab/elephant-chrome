import { describe, expect, it } from 'vitest'
import { addDays, subDays, format } from 'date-fns'
import { parseDate } from '@/shared/datetime'

/**
 * Tests the date arithmetic used by the DateChanger component.
 *
 * The component parses a 'yyyy-MM-dd' query param with parseDate() (local
 * midnight), adds/subtracts days, then formats back with date-fns format().
 *
 * Previous bugs:
 * - toISOString().split('T')[0] converted to UTC, breaking DST transitions
 * - new Date('yyyy-MM-dd') parsed as UTC midnight, not local midnight
 */

function getDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function simulateNav(from: string, steps: number, direction: 'forward' | 'back'): string {
  const parsed = parseDate(from) ?? new Date()
  const fn = direction === 'forward' ? addDays : subDays
  return getDateString(fn(parsed, steps))
}

describe('DateChanger date arithmetic', () => {
  it('navigates forward by 1 day', () => {
    expect(simulateNav('2026-01-15', 1, 'forward')).toBe('2026-01-16')
  })

  it('navigates backward by 1 day', () => {
    expect(simulateNav('2026-01-16', 1, 'back')).toBe('2026-01-15')
  })

  it('navigates forward by 7 days (week view)', () => {
    expect(simulateNav('2026-01-15', 7, 'forward')).toBe('2026-01-22')
  })

  it('navigates backward by 7 days (week view)', () => {
    expect(simulateNav('2026-01-22', 7, 'back')).toBe('2026-01-15')
  })

  describe('spring DST boundary (CET → CEST, March 29)', () => {
    it('navigates forward from March 29 to March 30', () => {
      expect(simulateNav('2026-03-29', 1, 'forward')).toBe('2026-03-30')
    })

    it('navigates backward from March 30 to March 29', () => {
      expect(simulateNav('2026-03-30', 1, 'back')).toBe('2026-03-29')
    })

    it('navigates forward by 7 days across DST boundary', () => {
      expect(simulateNav('2026-03-26', 7, 'forward')).toBe('2026-04-02')
    })

    it('navigates backward by 7 days across DST boundary', () => {
      expect(simulateNav('2026-04-02', 7, 'back')).toBe('2026-03-26')
    })
  })

  describe('autumn DST boundary (CEST → CET, October 25)', () => {
    it('navigates forward from October 25 to October 26', () => {
      expect(simulateNav('2026-10-25', 1, 'forward')).toBe('2026-10-26')
    })

    it('navigates backward from October 26 to October 25', () => {
      expect(simulateNav('2026-10-26', 1, 'back')).toBe('2026-10-25')
    })

    it('navigates forward by 7 days across DST boundary', () => {
      expect(simulateNav('2026-10-22', 7, 'forward')).toBe('2026-10-29')
    })

    it('navigates backward by 7 days across DST boundary', () => {
      expect(simulateNav('2026-10-29', 7, 'back')).toBe('2026-10-22')
    })
  })

  describe('year and month boundaries', () => {
    it('navigates across year boundary forward', () => {
      expect(simulateNav('2026-12-31', 1, 'forward')).toBe('2027-01-01')
    })

    it('navigates across year boundary backward', () => {
      expect(simulateNav('2027-01-01', 1, 'back')).toBe('2026-12-31')
    })

    it('handles leap year Feb 28 → Feb 29', () => {
      expect(simulateNav('2028-02-28', 1, 'forward')).toBe('2028-02-29')
    })

    it('handles non-leap year Feb 28 → Mar 1', () => {
      expect(simulateNav('2026-02-28', 1, 'forward')).toBe('2026-03-01')
    })
  })
})
