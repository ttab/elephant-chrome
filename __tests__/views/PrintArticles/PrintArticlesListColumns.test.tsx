import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ColumnDef, Row } from '@tanstack/react-table'
import type { ReactElement } from 'react'

import { printArticlesListColumns } from '@/views/PrintArticles/PrintArticlesListColumns'
import type { PrintArticle } from '@/hooks/baboon/lib/printArticles'

type AccessorOf<T> = (data: T) => string | undefined
type ColumnWithAccessor<T> = ColumnDef<T> & { accessorFn?: AccessorOf<T> }

vi.mock('@/components/Table/Items/DocumentStatus', () => ({
  DocumentStatus: ({ type, status }: { type: string, status: string }) => (
    <span data-testid='document-status-mock'>{`${type}:${status}`}</span>
  )
}))

vi.mock('@/components/Commands/FacetedFilter', () => ({
  FacetedFilter: () => <div data-testid='faceted-filter-mock' />
}))

function buildRow(fields: Partial<PrintArticle['fields']>): PrintArticle {
  return {
    id: 'doc-1',
    score: 1,
    fields: fields as PrintArticle['fields'],
    source: {},
    sort: []
  }
}

function buildColumns(): Array<ColumnDef<PrintArticle>> {
  return printArticlesListColumns({ printFlows: [] })
}

function getColumn(id: string): ColumnDef<PrintArticle> {
  const column = buildColumns().find((c) => c.id === id)
  if (!column) {
    throw new Error(`Column "${id}" not found`)
  }
  return column
}

// A stand-in `row` that backs `row.getValue(id)` via the column's accessorFn
// and exposes `row.original` for cell renderers that read raw fields.
function buildRowProxy(data: PrintArticle): Row<PrintArticle> {
  const columns = buildColumns() as Array<ColumnWithAccessor<PrintArticle>>
  const proxy = {
    original: data,
    getValue: (columnId: string) => {
      const column = columns.find((c) => c.id === columnId)
      return column?.accessorFn ? column.accessorFn(data) : undefined
    }
  }
  return proxy as unknown as Row<PrintArticle>
}

function renderCell(column: ColumnDef<PrintArticle>, data: PrintArticle): void {
  if (typeof column.cell !== 'function') {
    throw new Error(`Column "${column.id ?? '?'}" has no cell renderer`)
  }
  const row = buildRowProxy(data)
  const cell = column.cell as (ctx: { row: Row<PrintArticle> }) => ReactElement
  render(cell({ row }))
}

describe('printArticlesListColumns workflowState column', () => {
  const column = () => getColumn('workflowState')

  it('accessorFn returns workflow_state', () => {
    const data = buildRow({ workflow_state: { values: ['done'] } })
    const accessor = (column() as ColumnWithAccessor<PrintArticle>).accessorFn!
    expect(accessor(data)).toBe('done')
  })

  it('accessorFn falls back to draft when workflow_state is missing', () => {
    const accessor = (column() as ColumnWithAccessor<PrintArticle>).accessorFn!
    expect(accessor(buildRow({}))).toBe('draft')
  })

  it('cell renders the workflow_state value', () => {
    const data = buildRow({ workflow_state: { values: ['done'] } })
    renderCell(column(), data)
    expect(screen.getByTestId('document-status-mock')).toHaveTextContent(
      'tt/print-article:done'
    )
  })

  it('cell renders unpublished when workflow_state is unpublished', () => {
    const data = buildRow({ workflow_state: { values: ['unpublished'] } })
    renderCell(column(), data)
    expect(screen.getByTestId('document-status-mock')).toHaveTextContent(
      'tt/print-article:unpublished'
    )
  })

  // Regression for ELELOG-403: previously the cell preferred workflow_checkpoint
  // over workflow_state, so a stale checkpoint left over by the optimistic
  // subscription merge kept the row visually pinned to "unpublished" after a
  // usable -> unpublish -> done transition.
  it('cell ignores a stale workflow_checkpoint and follows workflow_state', () => {
    const data = buildRow({
      workflow_state: { values: ['done'] },
      workflow_checkpoint: { values: ['unpublished'] }
    })
    renderCell(column(), data)
    expect(screen.getByTestId('document-status-mock')).toHaveTextContent(
      'tt/print-article:done'
    )
  })
})
