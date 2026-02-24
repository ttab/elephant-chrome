import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import type { Cell } from '@tanstack/react-table'
import * as ReactTable from '@tanstack/react-table'
import { makeRow, plainRowData } from '../../data/tableMocks'

vi.mock('@ttab/elephant-ui', () => ({
  TableRow: ({ children, ...props }: React.HTMLProps<HTMLTableRowElement>) => (
    <tr data-testid='table-row' {...props}>{children}</tr>
  ),
  TableCell: ({ children, ...props }: React.HTMLProps<HTMLTableCellElement>) => (
    <td {...props}>{children}</td>
  )
}))

vi.mock('@tanstack/react-table', async (importOriginal) => {
  const original = await importOriginal<typeof ReactTable>()
  return {
    ...original,
    flexRender: vi.fn(() => <span data-testid='cell-content' />)
  }
})

// Import after mocks are in place
import { Row } from '@/components/Table/Row'

const makeCell = (id: string, className?: string): Cell<typeof plainRowData, unknown> => ({
  id,
  column: {
    columnDef: {
      cell: vi.fn(),
      meta: className ? { className } : undefined
    },
    id
  },
  getContext: vi.fn(() => ({}))
} as unknown as Cell<typeof plainRowData, unknown>)

describe('Row', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('data-state attribute', () => {
    it('has data-state="selected" when row.original.id is in openDocuments', () => {
      const row = makeRow(plainRowData)
      render(
        <table>
          <tbody>
            <Row row={row} handleOpen={vi.fn()} openDocuments={['doc-001']} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('table-row')
      expect(tr).toHaveAttribute('data-state', 'selected')
    })

    it('has no data-state when id is not in openDocuments', () => {
      const row = makeRow(plainRowData)
      render(
        <table>
          <tbody>
            <Row row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('table-row')
      expect(tr).not.toHaveAttribute('data-state', 'selected')
    })

    it('has no data-state when uuid is empty string', () => {
      const row = makeRow({ id: '' })
      render(
        <table>
          <tbody>
            <Row row={row} handleOpen={vi.fn()} openDocuments={['doc-001']} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('table-row')
      expect(tr).not.toHaveAttribute('data-state', 'selected')
    })
  })

  describe('className alignment', () => {
    it('has "items-start" class when align prop is "start"', () => {
      const row = makeRow(plainRowData)
      render(
        <table>
          <tbody>
            <Row row={row} handleOpen={vi.fn()} openDocuments={[]} align='start' />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('table-row')
      expect(tr.className).toContain('items-start')
      expect(tr.className).not.toContain('items-center')
    })

    it('has "items-center" class by default', () => {
      const row = makeRow(plainRowData)
      render(
        <table>
          <tbody>
            <Row row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('table-row')
      expect(tr.className).toContain('items-center')
      expect(tr.className).not.toContain('items-start')
    })
  })

  describe('auto-focus via ref callback', () => {
    it('calls focus() on the element when row.getIsSelected() is true', () => {
      const row = makeRow(plainRowData, {
        getIsSelected: vi.fn(() => true)
      })
      render(
        <table>
          <tbody>
            <Row row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('table-row')
      // Focused element should be the rendered tr
      expect(document.activeElement).toBe(tr)
    })

    it('does not call focus() when row.getIsSelected() is false', () => {
      const row = makeRow(plainRowData, {
        getIsSelected: vi.fn(() => false)
      })
      render(
        <table>
          <tbody>
            <Row row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('table-row')
      expect(document.activeElement).not.toBe(tr)
    })
  })

  describe('click handler', () => {
    it('calls handleOpen with the event and row when clicked', () => {
      const handleOpen = vi.fn()
      const row = makeRow(plainRowData)
      render(
        <table>
          <tbody>
            <Row row={row} handleOpen={handleOpen} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tr = screen.getByTestId('table-row')
      fireEvent.click(tr)
      expect(handleOpen).toHaveBeenCalledTimes(1)
      expect(handleOpen).toHaveBeenCalledWith(expect.any(Object), row)
    })
  })

  describe('cell rendering', () => {
    it('renders one TableCell per visible cell', () => {
      const cells = [makeCell('col1'), makeCell('col2'), makeCell('col3')]
      const row = makeRow(plainRowData, {
        getVisibleCells: vi.fn(() => cells)
      })
      render(
        <table>
          <tbody>
            <Row row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const tds = document.querySelectorAll('td')
      expect(tds).toHaveLength(3)
    })

    it('applies cell column meta className to TableCell', () => {
      const cells = [makeCell('col1', 'custom-class')]
      const row = makeRow(plainRowData, {
        getVisibleCells: vi.fn(() => cells)
      })
      render(
        <table>
          <tbody>
            <Row row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      const td = document.querySelector('td')
      expect(td?.className).toContain('custom-class')
    })

    it('calls flexRender with cell.column.columnDef.cell and cell.getContext()', () => {
      const { flexRender } = ReactTable
      const cells = [makeCell('col1')]
      const row = makeRow(plainRowData, {
        getVisibleCells: vi.fn(() => cells)
      })
      render(
        <table>
          <tbody>
            <Row row={row} handleOpen={vi.fn()} openDocuments={[]} />
          </tbody>
        </table>
      )
      expect(flexRender).toHaveBeenCalledWith(
        cells[0].column.columnDef.cell,
        expect.any(Object)
      )
    })
  })
})
