import { render, screen } from '@testing-library/react'
import type { Row, ColumnDef } from '@tanstack/react-table'
import { useTable } from '@/hooks/useTable'

vi.mock('@/hooks/useTable', () => ({ useTable: vi.fn() }))

vi.mock('@ttab/elephant-ui', () => ({
  TableRow: ({ children, ...props }: React.HTMLProps<HTMLTableRowElement>) => (
    <tr {...props}>{children}</tr>
  ),
  TableCell: ({ children, ...props }: React.HTMLProps<HTMLTableCellElement>) => (
    <td {...props}>{children}</td>
  )
}))

import { GroupedRowsHeader } from '@/components/Table/GroupedRowsHeader'

type TestData = { id: string, status?: string }

function makeGroupRow(groupingValue: string, subRowCount = 3): Row<TestData> {
  return {
    id: 'group-0',
    groupingValue,
    subRows: Array.from({ length: subRowCount }, (_, i) => ({ id: `sub-${i}` }))
  } as unknown as Row<TestData>
}

function makeColumns(
  id: string,
  meta?: { name?: string, display?: (val: string) => React.ReactNode }
): Array<ColumnDef<TestData>> {
  return [{ id, meta }] as unknown as Array<ColumnDef<TestData>>
}

describe('GroupedRowsHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTable).mockReturnValue({
      table: {
        getState: vi.fn(() => ({ grouping: ['status'] }))
      }
    } as unknown as ReturnType<typeof useTable>)
  })

  it('renders the column meta.name as a label', () => {
    const row = makeGroupRow('active')
    const columns = makeColumns('status', { name: 'Status' })
    render(
      <table>
        <tbody>
          <GroupedRowsHeader row={row} columns={columns} />
        </tbody>
      </table>
    )
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders groupingValue directly when meta.display is not a function', () => {
    const row = makeGroupRow('active')
    const columns = makeColumns('status', { name: 'Status' })
    render(
      <table>
        <tbody>
          <GroupedRowsHeader row={row} columns={columns} />
        </tbody>
      </table>
    )
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('calls meta.display(groupingValue) and renders its output', () => {
    const displayFn = vi.fn((val: string) => <span data-testid='custom-display'>{val.toUpperCase()}</span>)
    const row = makeGroupRow('active')
    const columns = makeColumns('status', { name: 'Status', display: displayFn })
    render(
      <table>
        <tbody>
          <GroupedRowsHeader row={row} columns={columns} />
        </tbody>
      </table>
    )
    expect(displayFn).toHaveBeenCalledWith('active')
    expect(screen.getByTestId('custom-display')).toBeInTheDocument()
    expect(screen.getByTestId('custom-display').textContent).toBe('ACTIVE')
  })

  it('renders the subRows count after "Antal" label', () => {
    const row = makeGroupRow('active', 7)
    const columns = makeColumns('status', { name: 'Status' })
    render(
      <table>
        <tbody>
          <GroupedRowsHeader row={row} columns={columns} />
        </tbody>
      </table>
    )
    expect(screen.getByText('Antal')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders gracefully when no column matches the grouping id', () => {
    // grouping is 'status' but column id is 'category'
    const row = makeGroupRow('active')
    const columns = makeColumns('category', { name: 'Category' })
    expect(() => {
      render(
        <table>
          <tbody>
            <GroupedRowsHeader row={row} columns={columns} />
          </tbody>
        </table>
      )
    }).not.toThrow()
    // groupingValue still shows
    expect(screen.getByText('active')).toBeInTheDocument()
  })
})
