import { describe, it, expect } from 'vitest'
import { getWireStatus } from '../src/lib/getWireStatus'
import type { Wire } from '@/shared/schemas/wire'

describe('getWireStatus', () => {
  it('returns draft when there are no valid statuses', () => {
    const wire = { id: '2', fields: {} } as unknown as Wire
    expect(getWireStatus(wire)).toBe('draft')

    const wireWithOldVersions = {
      id: '3',
      fields: {
        'heads.read.created': { values: ['2020-01-01T00:00:00Z'] },
        'heads.read.version': { values: ['-1'] },
        'heads.saved.created': { values: ['invalid-date'] },
        'heads.saved.version': { values: ['2'] }
      }
    } as unknown as Wire

    // saved has invalid timestamp, read has version <= 1 -> still draft
    expect(getWireStatus(wireWithOldVersions)).toBe('draft')
  })

  it('returns the key of the most recent valid status', () => {
    const now = new Date()
    const earlier = new Date(now.getTime() - 1000 * 60 * 60).toISOString()
    const later = new Date(now.getTime() + 1000 * 60 * 60).toISOString()

    const wire = {
      id: '4',
      fields: {
        'heads.read.created': { values: [earlier] },
        'heads.read.version': { values: ['2'] },
        'heads.saved.created': { values: [now.toISOString()] },
        'heads.saved.version': { values: ['3'] },
        'heads.used.created': { values: [later] },
        'heads.used.version': { values: ['2'] }
      }
    } as unknown as Wire

    // 'used' is the most recent timestamp
    expect(getWireStatus(wire)).toBe('used')
  })

  it('ignores statuses with NaN timestamps', () => {
    const wire = {
      id: '5',
      fields: {
        'heads.read.created': { values: ['not-a-date'] },
        'heads.read.version': { values: ['2'] },
        'heads.saved.created': { values: ['2025-01-01T00:00:00Z'] },
        'heads.saved.version': { values: ['2'] }
      }
    } as unknown as Wire

    // read is invalid date, saved is valid and should be chosen
    expect(getWireStatus(wire)).toBe('saved')
  })

  it('returns "draft" when version is "0" — version check is >= 1', () => {
    const wire = {
      id: '6',
      fields: {
        'heads.read.created': { values: ['2025-01-01T00:00:00Z'] },
        'heads.read.version': { values: ['0'] }
      }
    } as unknown as Wire

    // version 0 is not >= 1, so should return draft
    expect(getWireStatus(wire)).toBe('draft')
  })

  it('returns "read" when only read head is valid', () => {
    const wire = {
      id: '7',
      fields: {
        'heads.read.created': { values: ['2025-01-01T12:00:00Z'] },
        'heads.read.version': { values: ['2'] },
        'heads.saved.created': { values: [''] },
        'heads.saved.version': { values: ['0'] },
        'heads.used.created': { values: [''] },
        'heads.used.version': { values: ['0'] }
      }
    } as unknown as Wire

    expect(getWireStatus(wire)).toBe('read')
  })

  it('returns "saved" when saved is the only valid status', () => {
    const wire = {
      id: '8',
      fields: {
        'heads.saved.created': { values: ['2025-06-01T08:00:00Z'] },
        'heads.saved.version': { values: ['3'] }
      }
    } as unknown as Wire

    expect(getWireStatus(wire)).toBe('saved')
  })

  it('returns "used" when used is the only valid status', () => {
    const wire = {
      id: '9',
      fields: {
        'heads.used.created': { values: ['2025-06-01T09:00:00Z'] },
        'heads.used.version': { values: ['1'] }
      }
    } as unknown as Wire

    expect(getWireStatus(wire)).toBe('used')
  })

  it('handles wire with completely missing fields object without crashing', () => {
    const wire = { id: '10' } as unknown as Wire
    // fields is undefined — should not throw, should return draft
    expect(() => getWireStatus(wire)).not.toThrow()
    expect(getWireStatus(wire)).toBe('draft')
  })
})
