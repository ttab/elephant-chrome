import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import React from 'react'
import type { Row as RowType, ColumnDef } from '@tanstack/react-table'
import type { TableRowData } from '@/components/Table/types'
import type { NavigationAction, ViewProviderState } from '@/types/index'
import type { Dispatch } from 'react'

// ------- module mocks -------
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

vi.mock('@/components/Table/Row', () => ({
  Row: vi.fn(() => <tr data-testid='regular-row' />)
}))

vi.mock('@/components/Table/GroupedRows', () => ({
  GroupedRows: vi.fn(() => <tr data-testid='grouped-rows' />)
}))

vi.mock('@/components/Link/lib/handleLink', () => ({ handleLink: vi.fn() }))

vi.mock('@/views/Wires/components', () => ({
  PreviewSheet: vi.fn(() => null)
}))

vi.mock('@/views/Wire', () => ({
  Wire: vi.fn(() => null)
}))

vi.mock('@ttab/elephant-ui', () => ({
  Table: ({ children }: React.PropsWithChildren) => <table data-testid='main-table'>{children}</table>,
  TableBody: ({ children }: React.PropsWithChildren) => <tbody>{children}</tbody>
}))

// ------- imports after mocks -------
import {
  useNavigation,
  useView,
  useTable,
  useHistory,
  useNavigationKeys,
  useOpenDocuments,
  useWorkflowStatus
} from '@/hooks'
import { useModal } from '@/components/Modal/useModal'
import { handleLink } from '@/components/Link/lib/handleLink'
import { Row } from '@/components/Table/Row'
import { GroupedRows } from '@/components/Table/GroupedRows'
import { Table } from '@/components/Table'

// ------- helpers -------

type TestData = TableRowData & { status?: string, __updater?: unknown }

function makeTableRow(id: string, overrides: Partial<RowType<TestData>> = {}): RowType<TestData> {
  return {
    id,
    original: { id },
    getIsSelected: vi.fn(() => false),
    toggleSelected: vi.fn(),
    getVisibleCells: vi.fn(() => []),
    subRows: [],
    ...overrides
  } as unknown as RowType<TestData>
}

function makeWireTableRow(id: string): RowType<TestData> {
  return makeTableRow(id, {
    original: {
      id,
      fields: {
        'document.meta.tt_wire.role': { values: ['main'] },
        current_version: { values: ['1'] },
        'heads.read.version': { values: ['0'] },
        'heads.read.created': { values: [''] },
        'heads.saved.version': { values: ['0'] },
        'heads.saved.created': { values: [''] },
        'heads.used.version': { values: ['0'] },
        'heads.used.created': { values: [''] },
        'heads.flash.version': { values: [] },
        'document.meta.core_newsvalue.value': { values: ['3'] }
      }
    } as TestData
  })
}

const columns: Array<ColumnDef<TestData>> = [{ id: 'col1' }]

// Keyboard navigation callback capture
let capturedNavCallback: ((event: KeyboardEvent) => void) | undefined

function setupDefaultMocks(rows: Array<RowType<TestData>> = [], grouping: string[] = []) {
  capturedNavCallback = undefined

  const mockSetDocumentStatus = vi.fn().mockResolvedValue(undefined)

  vi.mocked(useNavigation).mockReturnValue({
    state: {
      viewRegistry: new Map(),
      content: [],
      active: ''
    } as unknown as ReturnType<typeof useNavigation>['state'],
    dispatch: vi.fn() as unknown as Dispatch<NavigationAction>
  })

  vi.mocked(useView).mockReturnValue({
    viewId: 'table-view-id',
    isActive: true
  } as ViewProviderState)

  vi.mocked(useTable).mockReturnValue({
    table: {
      getRowModel: vi.fn(() => ({ rows })),
      getState: vi.fn(() => ({
        grouping,
        rowSelection: {}
      })),
      getGroupedSelectedRowModel: vi.fn(() => ({ flatRows: [] })),
      getSelectedRowModel: vi.fn(() => ({ rows: [] }))
    }
  } as unknown as ReturnType<typeof useTable>)

  vi.mocked(useHistory).mockReturnValue({
    state: null,
    pushState: vi.fn(),
    replaceState: vi.fn(),
    setActiveView: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn()
  })

  vi.mocked(useNavigationKeys).mockImplementation(({ onNavigation }) => {
    capturedNavCallback = onNavigation
  })

  vi.mocked(useOpenDocuments).mockReturnValue([] as unknown as ReturnType<typeof useOpenDocuments>)

  vi.mocked(useWorkflowStatus).mockReturnValue([undefined, mockSetDocumentStatus] as unknown as ReturnType<typeof useWorkflowStatus>)

  const mockShowModal = vi.fn()
  const mockHideModal = vi.fn()
  vi.mocked(useModal).mockReturnValue({
    showModal: mockShowModal,
    hideModal: mockHideModal,
    currentModal: null
  } as unknown as ReturnType<typeof useModal>)

  return { mockSetDocumentStatus, mockShowModal, mockHideModal }
}

describe('Table', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('non-grouped rendering', () => {
    it('renders a Row for each non-grouped table row', () => {
      const rows = [makeTableRow('r1'), makeTableRow('r2'), makeTableRow('r3')]
      setupDefaultMocks(rows)
      render(<Table columns={columns} />)
      expect(screen.getAllByTestId('regular-row')).toHaveLength(3)
    })

    it('renders nothing when table has no rows', () => {
      setupDefaultMocks([])
      render(<Table columns={columns} />)
      expect(screen.queryByTestId('regular-row')).toBeNull()
      expect(screen.queryByTestId('grouped-rows')).toBeNull()
    })

    it('passes openDocuments to Row', () => {
      const rows = [makeTableRow('r1')]
      setupDefaultMocks(rows)
      vi.mocked(useOpenDocuments).mockReturnValue(['doc-open-1'] as unknown as ReturnType<typeof useOpenDocuments>)
      render(<Table columns={columns} />)
      const rowCalls = vi.mocked(Row).mock.calls
      expect(rowCalls[0][0].openDocuments).toContain('doc-open-1')
    })
  })

  describe('grouped rendering', () => {
    it('renders GroupedRows when grouping.length > 0', () => {
      const rows = [makeTableRow('g1'), makeTableRow('g2')]
      setupDefaultMocks(rows, ['status'])
      render(<Table columns={columns} />)
      expect(screen.getAllByTestId('grouped-rows')).toHaveLength(2)
    })

    it('passes columns, handleOpen, openDocuments to GroupedRows', () => {
      const rows = [makeTableRow('g1')]
      setupDefaultMocks(rows, ['status'])
      vi.mocked(useOpenDocuments).mockReturnValue(['open-doc'] as unknown as ReturnType<typeof useOpenDocuments>)
      render(<Table columns={columns} />)
      const groupCalls = vi.mocked(GroupedRows).mock.calls
      expect(groupCalls[0][0].columns).toBe(columns)
      expect(groupCalls[0][0].openDocuments).toContain('open-doc')
      expect(groupCalls[0][0].handleOpen).toBeTypeOf('function')
    })
  })

  describe('handleOpen — wire rows', () => {
    it('calls showModal with PreviewSheet when row is a wire', () => {
      const wireRow = makeWireTableRow('wire-1')
      const rows = [wireRow]
      const { mockShowModal } = setupDefaultMocks(rows)
      render(<Table columns={columns} />)

      // Get handleOpen from the Row mock call
      const rowCall = vi.mocked(Row).mock.calls[0]
      const handleOpenFn = rowCall[0].handleOpen

      act(() => {
        handleOpenFn(new MouseEvent('click') as unknown as React.MouseEvent<HTMLTableRowElement>, wireRow)
      })

      expect(mockShowModal).toHaveBeenCalledTimes(1)
    })

    it('calls row.toggleSelected(true) when previewing a wire', () => {
      const wireRow = makeWireTableRow('wire-1')
      const rows = [wireRow]
      setupDefaultMocks(rows)
      render(<Table columns={columns} />)

      const rowCall = vi.mocked(Row).mock.calls[0]
      const handleOpenFn = rowCall[0].handleOpen

      act(() => {
        handleOpenFn(new MouseEvent('click') as unknown as React.MouseEvent<HTMLTableRowElement>, wireRow)
      })

      expect(wireRow.toggleSelected).toHaveBeenCalledWith(true)
    })
  })

  describe('handleOpen — non-wire rows', () => {
    it('calls handleLink when onRowSelected is provided and no rowAction', () => {
      const row = makeTableRow('doc-1')
      const rows = [row]
      setupDefaultMocks(rows)
      const onRowSelected = vi.fn()
      render(<Table columns={columns} onRowSelected={onRowSelected} />)

      const rowCall = vi.mocked(Row).mock.calls[0]
      const handleOpenFn = rowCall[0].handleOpen
      const mockEvent = { target: { dataset: {} } } as unknown as React.MouseEvent<HTMLTableRowElement>

      act(() => {
        handleOpenFn(mockEvent, row)
      })

      expect(handleLink).toHaveBeenCalledTimes(1)
    })

    it('does not call handleLink when target has data-rowAction', () => {
      const row = makeTableRow('doc-1')
      const rows = [row]
      setupDefaultMocks(rows)
      const onRowSelected = vi.fn()
      render(<Table columns={columns} onRowSelected={onRowSelected} />)

      const rowCall = vi.mocked(Row).mock.calls[0]
      const handleOpenFn = rowCall[0].handleOpen
      const mockEvent = {
        target: { dataset: { rowAction: 'delete' } }
      } as unknown as React.MouseEvent<HTMLTableRowElement>

      act(() => {
        handleOpenFn(mockEvent, row)
      })

      expect(handleLink).not.toHaveBeenCalled()
    })

    it('does not navigate when onRowSelected is not provided', () => {
      const row = makeTableRow('doc-1')
      const rows = [row]
      setupDefaultMocks(rows)
      // No onRowSelected prop
      render(<Table columns={columns} />)

      const rowCall = vi.mocked(Row).mock.calls[0]
      const handleOpenFn = rowCall[0].handleOpen
      const mockEvent = { target: { dataset: {} } } as unknown as React.MouseEvent<HTMLTableRowElement>

      act(() => {
        handleOpenFn(mockEvent, row)
      })

      expect(handleLink).not.toHaveBeenCalled()
    })

    it('uses resolveNavigation result when provided', () => {
      const row = makeTableRow('doc-1')
      const rows = [row]
      setupDefaultMocks(rows)
      const onRowSelected = vi.fn()
      const resolveNavigation = vi.fn(() => ({ id: 'resolved-id', opensWith: 'Editor' as const }))
      render(
        <Table columns={columns} onRowSelected={onRowSelected} resolveNavigation={resolveNavigation} />
      )

      const rowCall = vi.mocked(Row).mock.calls[0]
      const handleOpenFn = rowCall[0].handleOpen
      const mockEvent = { target: { dataset: {} } } as unknown as React.MouseEvent<HTMLTableRowElement>

      act(() => {
        handleOpenFn(mockEvent, row)
      })

      expect(resolveNavigation).toHaveBeenCalledWith(row.original)
      expect(handleLink).toHaveBeenCalledTimes(1)
    })

    it('falls back to { id: row.original.id } when resolveNavigation is absent', () => {
      const row = makeTableRow('doc-fallback')
      const rows = [row]
      setupDefaultMocks(rows)
      const onRowSelected = vi.fn()
      render(<Table columns={columns} onRowSelected={onRowSelected} />)

      const rowCall = vi.mocked(Row).mock.calls[0]
      const handleOpenFn = rowCall[0].handleOpen
      const mockEvent = { target: { dataset: {} } } as unknown as React.MouseEvent<HTMLTableRowElement>

      act(() => {
        handleOpenFn(mockEvent, row)
      })

      const handleLinkCall = vi.mocked(handleLink).mock.calls[0][0]
      expect(handleLinkCall.props?.id).toBe('doc-fallback')
    })

    it('deletes __updater from row.original before navigation', () => {
      const row = makeTableRow('doc-1', {
        original: { id: 'doc-1', __updater: 'some-updater' }
      })
      const rows = [row]
      setupDefaultMocks(rows)
      const onRowSelected = vi.fn()
      render(<Table columns={columns} onRowSelected={onRowSelected} />)

      const rowCall = vi.mocked(Row).mock.calls[0]
      const handleOpenFn = rowCall[0].handleOpen
      const mockEvent = { target: { dataset: {} } } as unknown as React.MouseEvent<HTMLTableRowElement>

      act(() => {
        handleOpenFn(mockEvent, row)
      })

      expect('__updater' in row.original).toBe(false)
    })
  })

  describe('onRowSelected effect', () => {
    it('calls onRowSelected with selected row original', () => {
      const selectedRow = makeTableRow('sel-1')
      setupDefaultMocks([selectedRow])
      vi.mocked(useTable).mockReturnValue({
        table: {
          getRowModel: vi.fn(() => ({ rows: [selectedRow] })),
          getState: vi.fn(() => ({ grouping: [], rowSelection: {} })),
          getGroupedSelectedRowModel: vi.fn(() => ({ flatRows: [] })),
          getSelectedRowModel: vi.fn(() => ({ rows: [selectedRow] }))
        }
      } as unknown as ReturnType<typeof useTable>)

      const onRowSelected = vi.fn()
      render(<Table columns={columns} onRowSelected={onRowSelected} />)

      // The effect runs synchronously in test environment
      expect(onRowSelected).toHaveBeenCalledWith(selectedRow.original)
    })

    it('calls onRowSelected with undefined when no rows are selected', () => {
      setupDefaultMocks([])
      const onRowSelected = vi.fn()
      render(<Table columns={columns} onRowSelected={onRowSelected} />)
      expect(onRowSelected).toHaveBeenCalledWith(undefined)
    })
  })

  describe('children', () => {
    it('renders children before the table element', () => {
      setupDefaultMocks([])
      render(
        <Table columns={columns}>
          <div data-testid='child-content'>Hello</div>
        </Table>
      )
      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      const table = screen.getByTestId('main-table')
      // The child should appear before the table in the DOM
      const container = table.parentElement!
      const childContent = screen.getByTestId('child-content')
      const childIndex = Array.from(container.children).indexOf(childContent)
      const tableIndex = Array.from(container.children).indexOf(table)
      expect(childIndex).toBeLessThan(tableIndex)
    })
  })

  describe('keyboard navigation — Arrow keys', () => {
    it('ArrowDown selects first row when no row is selected', () => {
      const rows = [makeTableRow('r1'), makeTableRow('r2')]
      setupDefaultMocks(rows)
      render(<Table columns={columns} />)
      expect(capturedNavCallback).toBeDefined()
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      })
      expect(rows[0].toggleSelected).toHaveBeenCalledWith(true)
    })

    it('ArrowDown moves to next row from current selection', () => {
      const rows = [makeTableRow('r1'), makeTableRow('r2'), makeTableRow('r3')]
      // r1 is currently selected
      vi.mocked(rows[0].getIsSelected).mockReturnValue(true)
      setupDefaultMocks(rows)
      vi.mocked(useTable).mockReturnValue({
        table: {
          getRowModel: vi.fn(() => ({ rows })),
          getState: vi.fn(() => ({ grouping: [], rowSelection: {} })),
          getGroupedSelectedRowModel: vi.fn(() => ({ flatRows: [rows[0]] })),
          getSelectedRowModel: vi.fn(() => ({ rows: [rows[0]] }))
        }
      } as unknown as ReturnType<typeof useTable>)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      })
      expect(rows[1].toggleSelected).toHaveBeenCalledWith(true)
    })

    it('ArrowUp selects last row when no row is selected', () => {
      const rows = [makeTableRow('r1'), makeTableRow('r2'), makeTableRow('r3')]
      setupDefaultMocks(rows)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      })
      expect(rows[2].toggleSelected).toHaveBeenCalledWith(true)
    })

    it('ArrowUp moves to previous row', () => {
      const rows = [makeTableRow('r1'), makeTableRow('r2'), makeTableRow('r3')]
      vi.mocked(rows[1].getIsSelected).mockReturnValue(true)
      setupDefaultMocks(rows)
      vi.mocked(useTable).mockReturnValue({
        table: {
          getRowModel: vi.fn(() => ({ rows })),
          getState: vi.fn(() => ({ grouping: [], rowSelection: {} })),
          getGroupedSelectedRowModel: vi.fn(() => ({ flatRows: [rows[1]] })),
          getSelectedRowModel: vi.fn(() => ({ rows: [rows[1]] }))
        }
      } as unknown as ReturnType<typeof useTable>)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      })
      expect(rows[0].toggleSelected).toHaveBeenCalledWith(true)
    })

    it('ArrowDown does not advance past last row', () => {
      const rows = [makeTableRow('r1'), makeTableRow('r2')]
      // r2 is selected (last row)
      setupDefaultMocks(rows)
      vi.mocked(useTable).mockReturnValue({
        table: {
          getRowModel: vi.fn(() => ({ rows })),
          getState: vi.fn(() => ({ grouping: [], rowSelection: {} })),
          getGroupedSelectedRowModel: vi.fn(() => ({ flatRows: [rows[1]] })),
          getSelectedRowModel: vi.fn(() => ({ rows: [rows[1]] }))
        }
      } as unknown as ReturnType<typeof useTable>)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      })
      // Neither row should have toggleSelected called (no advancement possible)
      expect(rows[0].toggleSelected).not.toHaveBeenCalled()
      expect(rows[1].toggleSelected).not.toHaveBeenCalled()
    })

    it('ArrowUp does not go before first row', () => {
      const rows = [makeTableRow('r1'), makeTableRow('r2')]
      // r1 is selected (first row)
      setupDefaultMocks(rows)
      vi.mocked(useTable).mockReturnValue({
        table: {
          getRowModel: vi.fn(() => ({ rows })),
          getState: vi.fn(() => ({ grouping: [], rowSelection: {} })),
          getGroupedSelectedRowModel: vi.fn(() => ({ flatRows: [rows[0]] })),
          getSelectedRowModel: vi.fn(() => ({ rows: [rows[0]] }))
        }
      } as unknown as ReturnType<typeof useTable>)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
      })
      expect(rows[0].toggleSelected).not.toHaveBeenCalled()
      expect(rows[1].toggleSelected).not.toHaveBeenCalled()
    })

    it('ArrowDown with open modal triggers handleOpen on next row', () => {
      const rows = [makeTableRow('r1'), makeTableRow('r2')]
      setupDefaultMocks(rows)
      // Modal is open
      vi.mocked(useModal).mockReturnValue({
        showModal: vi.fn(),
        hideModal: vi.fn(),
        currentModal: { id: 'modal-open' }
      } as unknown as ReturnType<typeof useModal>)
      vi.mocked(useTable).mockReturnValue({
        table: {
          getRowModel: vi.fn(() => ({ rows })),
          getState: vi.fn(() => ({ grouping: [], rowSelection: {} })),
          getGroupedSelectedRowModel: vi.fn(() => ({ flatRows: [rows[0]] })),
          getSelectedRowModel: vi.fn(() => ({ rows: [rows[0]] }))
        }
      } as unknown as ReturnType<typeof useTable>)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
      })
      expect(rows[1].toggleSelected).toHaveBeenCalledWith(true)
    })
  })

  describe('keyboard navigation — Enter/Escape/Space', () => {
    it('Enter calls hideModal then handleOpen on selected row', () => {
      const selectedRow = makeTableRow('sel-1')
      const wireRow = makeWireTableRow('wire-sel')
      const rows = [selectedRow, wireRow]
      setupDefaultMocks(rows)
      const { mockHideModal, mockShowModal } = setupDefaultMocks(rows)
      vi.mocked(useTable).mockReturnValue({
        table: {
          getRowModel: vi.fn(() => ({ rows })),
          getState: vi.fn(() => ({ grouping: [], rowSelection: {} })),
          getGroupedSelectedRowModel: vi.fn(() => ({ flatRows: [wireRow] })),
          getSelectedRowModel: vi.fn(() => ({ rows: [wireRow] }))
        }
      } as unknown as ReturnType<typeof useTable>)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'Enter' }))
      })
      expect(mockHideModal).toHaveBeenCalledTimes(1)
      expect(mockShowModal).toHaveBeenCalledTimes(1) // wire preview
    })

    it('Escape calls toggleSelected(false) on selected row', () => {
      const selectedRow = makeTableRow('sel-1')
      const rows = [selectedRow]
      setupDefaultMocks(rows)
      vi.mocked(useTable).mockReturnValue({
        table: {
          getRowModel: vi.fn(() => ({ rows })),
          getState: vi.fn(() => ({ grouping: [], rowSelection: {} })),
          getGroupedSelectedRowModel: vi.fn(() => ({ flatRows: [selectedRow] })),
          getSelectedRowModel: vi.fn(() => ({ rows: [selectedRow] }))
        }
      } as unknown as ReturnType<typeof useTable>)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'Escape' }))
      })
      expect(selectedRow.toggleSelected).toHaveBeenCalledWith(false)
    })

    it('Space calls handleOpen on selected row (preview)', () => {
      const wireRow = makeWireTableRow('wire-space')
      const rows = [wireRow]
      const { mockShowModal } = setupDefaultMocks(rows)
      vi.mocked(useTable).mockReturnValue({
        table: {
          getRowModel: vi.fn(() => ({ rows })),
          getState: vi.fn(() => ({ grouping: [], rowSelection: {} })),
          getGroupedSelectedRowModel: vi.fn(() => ({ flatRows: [wireRow] })),
          getSelectedRowModel: vi.fn(() => ({ rows: [wireRow] }))
        }
      } as unknown as ReturnType<typeof useTable>)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: ' ' }))
      })
      expect(mockShowModal).toHaveBeenCalledTimes(1)
    })
  })

  describe('wire keyboard shortcuts', () => {
    function setupWireSelection(wireRow: RowType<TestData>, rows?: RowType<TestData>[]) {
      const allRows = rows ?? [wireRow]
      const { mockSetDocumentStatus } = setupDefaultMocks(allRows)
      vi.mocked(useTable).mockReturnValue({
        table: {
          getRowModel: vi.fn(() => ({ rows: allRows })),
          getState: vi.fn(() => ({ grouping: [], rowSelection: {} })),
          getGroupedSelectedRowModel: vi.fn(() => ({ flatRows: [wireRow] })),
          getSelectedRowModel: vi.fn(() => ({ rows: [wireRow] }))
        }
      } as unknown as ReturnType<typeof useTable>)
      return { mockSetDocumentStatus }
    }

    it('"r" toggles draft→read status', () => {
      const wireRow = makeWireTableRow('wire-r')
      const { mockSetDocumentStatus } = setupWireSelection(wireRow)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'r' }))
      })
      expect(mockSetDocumentStatus).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'read' }),
        undefined,
        true
      )
    })

    it('"r" toggles read→draft status', () => {
      const wireRow = makeWireTableRow('wire-r2')
      // Give the wire a valid "read" status by mutating via unknown cast
      const originalFields = (wireRow.original as unknown as { fields: Record<string, unknown> }).fields
      Object.assign(originalFields, {
        current_version: { values: ['2'] },
        'heads.read.version': { values: ['2'] },
        'heads.read.created': { values: ['2025-01-01T10:00:00Z'] }
      })
      const { mockSetDocumentStatus } = setupWireSelection(wireRow)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'r' }))
      })
      expect(mockSetDocumentStatus).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'draft' }),
        undefined,
        true
      )
    })

    it('"s" toggles saved status', () => {
      const wireRow = makeWireTableRow('wire-s')
      const { mockSetDocumentStatus } = setupWireSelection(wireRow)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 's' }))
      })
      expect(mockSetDocumentStatus).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'saved' }),
        undefined,
        true
      )
    })

    it('"u" toggles used status', () => {
      const wireRow = makeWireTableRow('wire-u')
      const { mockSetDocumentStatus } = setupWireSelection(wireRow)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'u' }))
      })
      expect(mockSetDocumentStatus).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'used' }),
        undefined,
        true
      )
    })

    it('"c" shows Wire creation dialog', () => {
      const wireRow = makeWireTableRow('wire-c')
      setupWireSelection(wireRow)
      const mockShowModal = vi.fn()
      vi.mocked(useModal).mockReturnValue({
        showModal: mockShowModal,
        hideModal: vi.fn(),
        currentModal: null
      } as unknown as ReturnType<typeof useModal>)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'c' }))
      })
      expect(mockShowModal).toHaveBeenCalledTimes(1)
    })

    it('shortcuts do nothing when selected row is not a wire', () => {
      const plainRow = makeTableRow('plain-1')
      const { mockSetDocumentStatus } = setupWireSelection(plainRow)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'r' }))
      })
      expect(mockSetDocumentStatus).not.toHaveBeenCalled()
    })

    it('shortcuts do nothing when no row is selected', () => {
      setupDefaultMocks([])
      const mockSetDocumentStatus = vi.fn()
      vi.mocked(useWorkflowStatus).mockReturnValue([undefined, mockSetDocumentStatus] as unknown as ReturnType<typeof useWorkflowStatus>)
      render(<Table columns={columns} />)
      act(() => {
        capturedNavCallback!(new KeyboardEvent('keydown', { key: 'r' }))
      })
      expect(mockSetDocumentStatus).not.toHaveBeenCalled()
    })
  })
})
