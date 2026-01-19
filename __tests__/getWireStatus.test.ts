import { describe, it, expect } from 'vitest'
import { getWireStatus } from '../src/components/Table/lib/getWireStatus'
import type { Wire } from '@/shared/schemas/wire'

describe('getWireStatus', () => {
  it('returns null for non-Wires document types', () => {
    const wire = { id: '1', fields: {} } as unknown as Wire
    expect(getWireStatus('Planning', wire)).toBeNull()
  })

  it('returns draft when there are no valid statuses', () => {
    const wire = { id: '2', fields: {} } as unknown as Wire
    expect(getWireStatus('Wires', wire)).toBe('draft')

    const wireWithOldVersions = {
      id: '3',
      fields: {
        'heads.read.created': { values: ['2020-01-01T00:00:00Z'] },
        'heads.read.version': { values: ['1'] },
        'heads.saved.created': { values: ['invalid-date'] },
        'heads.saved.version': { values: ['2'] }
      }
    } as unknown as Wire

    // saved has invalid timestamp, read has version <= 1 -> still draft
    expect(getWireStatus('Wires', wireWithOldVersions)).toBe('draft')
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
    expect(getWireStatus('Wires', wire)).toBe('used')
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
    expect(getWireStatus('Wires', wire)).toBe('saved')
  })
})
