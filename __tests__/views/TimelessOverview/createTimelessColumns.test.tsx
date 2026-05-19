import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ColumnDef, Row } from '@tanstack/react-table'
import type { ReactElement } from 'react'
import i18n from 'i18next'

type AccessorOf<T> = (data: T) => string | undefined
type ColumnWithAccessor<T> = ColumnDef<T> & { accessorFn?: AccessorOf<T> }
type DisplayFn = (value: string) => ReactElement

import { createTimelessColumns } from '@/views/TimelessOverview/lib/createTimelessColumns'
import type { TimelessArticle } from '@/shared/schemas/timelessArticle'
import { dateToReadableDateTime } from '@/shared/datetime'
import type { IDBTimelessCategory } from 'src/datastore/types'
import type { LocaleData } from '@/types/index'

// Mock the heavy/visual cell components so the tests focus on the column
// factory's accessor / cell / filterFn wiring, not the children.
vi.mock('@/components/Table/Items/Title', () => ({
  Title: ({ title }: { title: string }) => (
    <span data-testid='title-mock'>{title}</span>
  )
}))

vi.mock('@/components/Table/Items/DocumentStatus', () => ({
  DocumentStatus: ({ type, status }: { type: string, status: string }) => (
    <span data-testid='document-status-mock'>{`${type}:${status}`}</span>
  )
}))

vi.mock('@/views/TimelessOverview/lib/TimelessRowActions', () => ({
  TimelessRowActions: ({ documentId, status }: {
    documentId: string
    status?: string
  }) => (
    <span data-testid='timeless-row-actions-mock'>{`${documentId}:${status ?? ''}`}</span>
  )
}))

vi.mock('@/components/Commands/FacetedFilter', () => ({
  FacetedFilter: () => <div data-testid='faceted-filter-mock' />
}))

vi.mock('@/shared/datetime', () => ({
  dateToReadableDateTime: vi.fn(() => 'mocked-date')
}))

const locale: LocaleData = {
  // The `module` field is the date-fns Locale object; the column code only
  // needs `code.full`, so we cast a minimal stub instead of importing the
  // real locale to keep the test self-contained.
  module: {} as LocaleData['module'],
  code: {
    short: 'sv',
    long: 'sv-SE',
    full: 'sv-SE'
  }
}

const timeZone = 'Europe/Stockholm'

const categories: IDBTimelessCategory[] = [
  { id: 'cat-1', title: 'Sport' },
  { id: 'cat-2', title: 'Politik' }
]

function buildRow(fields: Partial<TimelessArticle['fields']>): TimelessArticle {
  return {
    id: 'doc-1',
    score: 1,
    fields: fields as TimelessArticle['fields'],
    source: {},
    sort: []
  }
}

function buildColumns(): Array<ColumnDef<TimelessArticle>> {
  return createTimelessColumns({
    locale,
    timeZone,
    categories,
    t: i18n.t
  })
}

function getColumn(id: string): ColumnDef<TimelessArticle> {
  const column = buildColumns().find((c) => c.id === id)
  if (!column) {
    throw new Error(`Column "${id}" not found`)
  }
  return column
}

// A stand-in `row` that backs `row.getValue(id)` via the column's accessorFn
// and exposes `row.original` for the actions column. tanstack types its row
// helpers heavily, so the helpers are cast at the call site once.
function buildRowProxy(data: TimelessArticle): Row<TimelessArticle> {
  const columns = buildColumns() as Array<ColumnWithAccessor<TimelessArticle>>
  const proxy = {
    original: data,
    getValue: (columnId: string) => {
      const column = columns.find((c) => c.id === columnId)
      return column?.accessorFn ? column.accessorFn(data) : undefined
    }
  }
  return proxy as unknown as Row<TimelessArticle>
}

function renderCell(
  column: ColumnDef<TimelessArticle>,
  data: TimelessArticle
): void {
  if (typeof column.cell !== 'function') {
    throw new Error(`Column "${column.id ?? '?'}" has no cell renderer`)
  }
  const row = buildRowProxy(data)
  const cell = column.cell as (ctx: { row: Row<TimelessArticle> }) => ReactElement
  render(cell({ row }))
}

describe('createTimelessColumns', () => {
  it('exposes the expected column ids in order', () => {
    const ids = buildColumns().map((c) => c.id)
    expect(ids).toEqual(['status', 'title', 'category', 'lastChanged', 'actions'])
  })

  describe('status column', () => {
    const column = () => getColumn('status')

    it('accessorFn reads workflow_state from index fields', () => {
      const data = buildRow({ workflow_state: { values: ['draft'] } })
      const accessor = (column() as ColumnWithAccessor<TimelessArticle>).accessorFn!
      expect(accessor(data)).toBe('draft')
    })

    it('accessorFn returns only the first value when several are present', () => {
      const data = buildRow({ workflow_state: { values: ['draft', 'done'] } })
      const accessor = (column() as ColumnWithAccessor<TimelessArticle>).accessorFn!
      expect(accessor(data)).toBe('draft')
    })

    it('meta.display routes through t() so the label is translated', () => {
      const display = (column().meta as { display: DisplayFn }).display
      const { container } = render(display('draft'))
      expect(container.textContent).toBe(i18n.t('core:status.draft'))
    })

    it('cell renders DocumentStatus when the status is present', () => {
      const data = buildRow({ workflow_state: { values: ['done'] } })
      renderCell(column(), data)
      expect(screen.getByTestId('document-status-mock')).toHaveTextContent(
        'core/article:done'
      )
    })

    it('cell renders muted "-" placeholder when workflow_state is missing', () => {
      renderCell(column(), buildRow({}))
      const placeholder = screen.getByText('-')
      expect(placeholder).toHaveClass('text-muted-foreground')
    })

    it('filterFn matches when the row value is in the filter set', () => {
      const filterFn = column().filterFn as (
        row: Row<TimelessArticle>,
        id: string,
        value: string[]
      ) => boolean
      const data = buildRow({ workflow_state: { values: ['draft'] } })
      expect(filterFn(buildRowProxy(data), 'status', ['draft', 'used'])).toBe(true)
      expect(filterFn(buildRowProxy(data), 'status', ['done', 'used'])).toBe(false)
    })
  })

  describe('title column', () => {
    const column = () => getColumn('title')

    it('accessorFn reads document.title from index fields', () => {
      const data = buildRow({ 'document.title': { values: ['Hello world'] } })
      const accessor = (column() as ColumnWithAccessor<TimelessArticle>).accessorFn!
      expect(accessor(data)).toBe('Hello world')
    })

    it('accessorFn returns only the first value when several are present', () => {
      const data = buildRow({ 'document.title': { values: ['First', 'Second'] } })
      const accessor = (column() as ColumnWithAccessor<TimelessArticle>).accessorFn!
      expect(accessor(data)).toBe('First')
    })

    it('cell renders Title with the resolved value', () => {
      const data = buildRow({ 'document.title': { values: ['Hello world'] } })
      renderCell(column(), data)
      expect(screen.getByTestId('title-mock')).toHaveTextContent('Hello world')
    })

    it('cell renders Title with empty content when document.title is missing', () => {
      renderCell(column(), buildRow({}))
      expect(screen.getByTestId('title-mock').textContent).toBe('')
    })
  })

  describe('category column', () => {
    const column = () => getColumn('category')

    it('accessorFn reads document.rel.subject.uuid from index fields', () => {
      const data = buildRow({
        'document.rel.subject.uuid': { values: ['cat-1'] }
      })
      const accessor = (column() as ColumnWithAccessor<TimelessArticle>).accessorFn!
      expect(accessor(data)).toBe('cat-1')
    })

    it('accessorFn returns only the first value when several are present', () => {
      const data = buildRow({
        'document.rel.subject.uuid': { values: ['cat-1', 'cat-2'] }
      })
      const accessor = (column() as ColumnWithAccessor<TimelessArticle>).accessorFn!
      expect(accessor(data)).toBe('cat-1')
    })

    it('meta.display renders the matching category title', () => {
      const display = (column().meta as { display: DisplayFn }).display
      render(display('cat-1'))
      expect(screen.getByText('Sport')).toBeInTheDocument()
    })

    it('meta.display renders empty when the uuid is unknown', () => {
      const display = (column().meta as { display: DisplayFn }).display
      const { container } = render(display('cat-missing'))
      expect(container.textContent).toBe('')
    })

    it('cell renders the matching category title', () => {
      const data = buildRow({
        'document.rel.subject.uuid': { values: ['cat-1'] }
      })
      renderCell(column(), data)
      expect(screen.getByText('Sport')).toBeInTheDocument()
    })

    it('cell renders muted "-" placeholder when the uuid is missing', () => {
      renderCell(column(), buildRow({}))
      const placeholder = screen.getByText('-')
      expect(placeholder).toHaveClass('text-muted-foreground')
    })

    it('cell renders muted "-" placeholder when the uuid is unknown', () => {
      const data = buildRow({
        'document.rel.subject.uuid': { values: ['cat-missing'] }
      })
      renderCell(column(), data)
      const placeholder = screen.getByText('-')
      expect(placeholder).toHaveClass('text-muted-foreground')
    })

    it('filterFn matches when the row value is in the filter set', () => {
      const filterFn = column().filterFn as (
        row: Row<TimelessArticle>,
        id: string,
        value: string[]
      ) => boolean
      const data = buildRow({
        'document.rel.subject.uuid': { values: ['cat-1'] }
      })
      expect(filterFn(buildRowProxy(data), 'category', ['cat-1'])).toBe(true)
      expect(filterFn(buildRowProxy(data), 'category', ['cat-2'])).toBe(false)
    })
  })

  describe('lastChanged column', () => {
    const column = () => getColumn('lastChanged')

    it('accessorFn reads modified from index fields', () => {
      const data = buildRow({ modified: { values: ['2025-12-31T12:00:00Z'] } })
      const accessor = (column() as ColumnWithAccessor<TimelessArticle>).accessorFn!
      expect(accessor(data)).toBe('2025-12-31T12:00:00Z')
    })

    it('cell formats modified via dateToReadableDateTime with locale, timezone, relative=true', () => {
      vi.mocked(dateToReadableDateTime).mockClear()
      const data = buildRow({ modified: { values: ['2025-12-31T12:00:00Z'] } })
      renderCell(column(), data)
      expect(dateToReadableDateTime).toHaveBeenCalledTimes(1)
      const [date, code, tz, relative] = vi.mocked(dateToReadableDateTime).mock.calls[0]
      expect(date).toBeInstanceOf(Date)
      expect(date.toISOString()).toBe('2025-12-31T12:00:00.000Z')
      expect(code).toBe('sv-SE')
      expect(tz).toBe('Europe/Stockholm')
      expect(relative).toBe(true)
      expect(screen.getByText('mocked-date')).toHaveClass('text-muted-foreground')
    })

    it('cell renders "-" when modified is missing', () => {
      renderCell(column(), buildRow({}))
      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })

  describe('actions column', () => {
    it('cell renders TimelessRowActions with the row id and status', () => {
      const column = getColumn('actions')
      const data = buildRow({ workflow_state: { values: ['draft'] } })
      renderCell(column, data)
      expect(screen.getByTestId('timeless-row-actions-mock')).toHaveTextContent(
        'doc-1:draft'
      )
    })
  })
})
