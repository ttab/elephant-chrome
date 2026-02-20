import { vi } from 'vitest'
import type { Wire } from '@/shared/schemas/wire'
import type { Row as RowType, Cell, ColumnDef } from '@tanstack/react-table'
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

export function makeReadWire(): Wire {
  return makeWire({
    current_version: { values: ['2'] },
    'heads.read.version': { values: ['2'] },
    'heads.read.created': { values: ['2025-01-01T10:00:00Z'] }
  })
}

export function makeSavedWire(): Wire {
  return makeWire({
    current_version: { values: ['2'] },
    'heads.saved.version': { values: ['2'] },
    'heads.saved.created': { values: ['2025-01-01T10:00:00Z'] }
  })
}

export function makeUsedWire(): Wire {
  return makeWire({
    current_version: { values: ['2'] },
    'heads.used.version': { values: ['2'] },
    'heads.used.created': { values: ['2025-01-01T10:00:00Z'] }
  })
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

// Minimal ColumnDef factory
export function makeColumnDef<TData>(id: string, overrides: Partial<ColumnDef<TData>> = {}): ColumnDef<TData> {
  return {
    id,
    cell: vi.fn(),
    meta: undefined,
    ...overrides
  } as ColumnDef<TData>
}
