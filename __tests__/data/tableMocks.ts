import type { Wire } from '@/shared/schemas/wire'
import type { Row as RowType, Cell } from '@tanstack/react-table'
import type { TableRowData } from '@/components/Table/types'

// Minimal Wire fixture factory
export function makeWire(fieldOverrides: Partial<Wire['fields']> = {}): Wire {
  return {
    id: 'wire-001',
    fields: {
      'document.meta.tt_wire.role': { values: ['main'] },
      current_version: { values: ['3'] },
      'heads.read.version': { values: ['0'] },
      'heads.read.created': { values: [''] },
      'heads.saved.version': { values: ['0'] },
      'heads.saved.created': { values: [''] },
      'heads.used.version': { values: ['0'] },
      'heads.used.created': { values: [''] },
      'heads.flash.version': { values: [] },
      'document.meta.core_newsvalue.value': { values: ['3'] },
      ...fieldOverrides
    }
  } as unknown as Wire
}

export function makeFlashWire(): Wire {
  return makeWire({ 'heads.flash.version': { values: ['1'] } })
}

// Minimal TanStack Row factory
export function makeRow<TData extends TableRowData>(
  original: TData,
  overrides: Partial<RowType<TData>> = {}
): RowType<TData> {
  return {
    id: 'row-0',
    original,
    getIsSelected: vi.fn(() => false),
    toggleSelected: vi.fn(),
    getVisibleCells: vi.fn(() => [] as Cell<TData, unknown>[]),
    subRows: [],
    groupingValue: 'Group A',
    ...overrides
  } as unknown as RowType<TData>
}

// Simple non-wire row data
export const plainRowData: TableRowData = { id: 'doc-001' }
