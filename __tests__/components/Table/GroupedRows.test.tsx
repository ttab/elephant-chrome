import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Row as RowType, ColumnDef } from '@tanstack/react-table'
import type { TableRowData } from '@/components/Table/types'

vi.mock('@/components/Table/Row', () => ({
  Row: vi.fn(() => <tr data-testid='regular-row' />)
}))

vi.mock('@/components/Table/WireRow', () => ({
  WireRow: vi.fn(() => <tr data-testid='wire-row' />)
}))

vi.mock('@/components/Table/GroupedRowsHeader', () => ({
  GroupedRowsHeader: vi.fn(() => <tr data-testid='group-header' />)
}))

// GroupedRows imports isWire from '.' (the barrel index.tsx)
vi.mock('@/components/Table', () => ({
  isWire: vi.fn()
}))

import { GroupedRows } from '@/components/Table/GroupedRows'
import { isWire } from '@/components/Table'
import { Row } from '@/components/Table/Row'
import { GroupedRowsHeader } from '@/components/Table/GroupedRowsHeader'

type TestData = TableRowData

function makeSubRow(id: string): RowType<TestData> {
  return {
    id,
    original: { id },
    getIsSelected: vi.fn(() => false),
    toggleSelected: vi.fn(),
    getVisibleCells: vi.fn(() => []),
    subRows: []
  } as unknown as RowType<TestData>
}

function makeGroupRow(subRowIds: string[]): RowType<TestData> {
  return {
    id: 'group-0',
    original: { id: 'group-doc-0' },
    subRows: subRowIds.map(makeSubRow),
    groupingValue: 'Group A'
  } as unknown as RowType<TestData>
}

const columns: Array<ColumnDef<TestData>> = [{ id: 'col1' }]
const handleOpen = vi.fn()
const openDocuments = ['doc-a']

describe('GroupedRows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isWire).mockReturnValue(false)
  })

  it('returns an empty fragment when subRows is empty', () => {
    const row = makeGroupRow([])
    const { container } = render(
      <table>
        <tbody>
          <GroupedRows row={row} columns={columns} handleOpen={handleOpen} openDocuments={openDocuments} />
        </tbody>
      </table>
    )
    // No group-header and no rows rendered
    expect(screen.queryByTestId('group-header')).toBeNull()
    expect(container.querySelectorAll('tr')).toHaveLength(0)
  })

  it('renders GroupedRowsHeader once', () => {
    const row = makeGroupRow(['sub-1', 'sub-2'])
    render(
      <table>
        <tbody>
          <GroupedRows row={row} columns={columns} handleOpen={handleOpen} openDocuments={openDocuments} />
        </tbody>
      </table>
    )
    expect(screen.getAllByTestId('group-header')).toHaveLength(1)
    expect(GroupedRowsHeader).toHaveBeenCalledTimes(1)
  })

  it('renders WireRow for each subRow when isWire returns true', () => {
    vi.mocked(isWire).mockReturnValue(true)
    const row = makeGroupRow(['sub-1', 'sub-2', 'sub-3'])
    render(
      <table>
        <tbody>
          <GroupedRows row={row} columns={columns} handleOpen={handleOpen} openDocuments={openDocuments} />
        </tbody>
      </table>
    )
    expect(screen.getAllByTestId('wire-row')).toHaveLength(3)
    expect(screen.queryByTestId('regular-row')).toBeNull()
  })

  it('renders RegularRow for each subRow when isWire returns false', () => {
    vi.mocked(isWire).mockReturnValue(false)
    const row = makeGroupRow(['sub-1', 'sub-2'])
    render(
      <table>
        <tbody>
          <GroupedRows row={row} columns={columns} handleOpen={handleOpen} openDocuments={openDocuments} />
        </tbody>
      </table>
    )
    expect(screen.getAllByTestId('regular-row')).toHaveLength(2)
    expect(screen.queryByTestId('wire-row')).toBeNull()
  })

  it('renders the correct number of sub-rows', () => {
    const row = makeGroupRow(['sub-1', 'sub-2', 'sub-3', 'sub-4'])
    render(
      <table>
        <tbody>
          <GroupedRows row={row} columns={columns} handleOpen={handleOpen} openDocuments={openDocuments} />
        </tbody>
      </table>
    )
    expect(screen.getAllByTestId('regular-row')).toHaveLength(4)
  })

  it('passes handleOpen and openDocuments to each row component', () => {
    const row = makeGroupRow(['sub-1', 'sub-2'])
    render(
      <table>
        <tbody>
          <GroupedRows row={row} columns={columns} handleOpen={handleOpen} openDocuments={openDocuments} />
        </tbody>
      </table>
    )
    const rowCalls = vi.mocked(Row).mock.calls
    expect(rowCalls).toHaveLength(2)
    rowCalls.forEach((call) => {
      expect(call[0].handleOpen).toBe(handleOpen)
      expect(call[0].openDocuments).toBe(openDocuments)
    })
  })
})
