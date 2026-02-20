import { describe, it, expect, vi } from 'vitest'

// Mock heavy dependencies so the barrel loads cleanly
vi.mock('@/views/Wires/components', () => ({ PreviewSheet: vi.fn() }))
vi.mock('@/views/Wire', () => ({ Wire: vi.fn() }))
vi.mock('@/hooks', () => ({
  useNavigation: vi.fn(),
  useView: vi.fn(),
  useTable: vi.fn(),
  useHistory: vi.fn(),
  useNavigationKeys: vi.fn(),
  useOpenDocuments: vi.fn(),
  useWorkflowStatus: vi.fn()
}))
vi.mock('@/components/Modal/useModal', () => ({ useModal: vi.fn() }))
vi.mock('@/components/Link/lib/handleLink', () => ({ handleLink: vi.fn() }))

import { isWire } from '@/components/Table/index'

describe('isWire', () => {
  it('returns true when fields contains "document.meta.tt_wire.role"', () => {
    const obj = {
      id: 'w1',
      fields: {
        'document.meta.tt_wire.role': { values: ['main'] }
      }
    }
    expect(isWire(obj)).toBe(true)
  })

  it('returns false when fields is an empty object', () => {
    const obj = { id: 'p1', fields: {} }
    expect(isWire(obj)).toBe(false)
  })

  it('returns false when fields does not contain the wire role key', () => {
    const obj = {
      id: 'p2',
      fields: {
        'document.title': { values: ['My Article'] }
      }
    }
    expect(isWire(obj)).toBe(false)
  })

  it('returns false when fields is null', () => {
    const obj = { id: 'p3', fields: null }
    expect(isWire(obj as unknown as { id: string })).toBe(false)
  })

  it('returns false when fields is undefined', () => {
    const obj = { id: 'p4' }
    expect(isWire(obj as unknown as { id: string })).toBe(false)
  })

  it('returns false when fields is a primitive (string)', () => {
    const obj = { id: 'p5', fields: 'not-an-object' }
    expect(isWire(obj as unknown as { id: string })).toBe(false)
  })

  it('returns false when the object has no fields property', () => {
    const obj = { id: 'p6' }
    expect(isWire(obj as unknown as { id: string })).toBe(false)
  })

  it('returns true even when other wire fields are absent', () => {
    const obj = {
      id: 'w2',
      fields: {
        'document.meta.tt_wire.role': { values: ['supplemental'] }
        // no other wire fields
      }
    }
    expect(isWire(obj)).toBe(true)
  })
})
