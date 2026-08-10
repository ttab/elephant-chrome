import { useEffect, type JSX } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { TableProvider } from '@/contexts/TableProvider'
import { NavigationProvider } from '@/navigation/NavigationProvider'
import { useTable } from '@/hooks/useTable'
import { render, screen } from '../setupTests'

interface Article {
  title: string
}

const columns: Array<ColumnDef<Article, unknown>> = [{
  id: 'title',
  accessorFn: (data) => data.title
}]

const data: Article[] = [
  { title: 'Björn Gustafson är död' },
  { title: 'Gudrun Sjödén - inte bara kulturtant' }
]

// Reports what the table actually hands to the view, so the assertions read the
// same row model the Table component renders from.
const Probe = (): JSX.Element => {
  const { table, setData } = useTable<Article>()

  useEffect(() => {
    setData(data)
  }, [setData])

  return (
    <>
      <span data-testid='rows'>{table.getRowModel().rows.length}</span>
      <span data-testid='global-filter'>
        {String(table.getState().globalFilter ?? '')}
      </span>
    </>
  )
}

function renderTable(serverSideGlobalFilter: boolean): void {
  render(
    <NavigationProvider>
      <TableProvider<Article>
        type='Timeless'
        columns={columns}
        serverSideGlobalFilter={serverSideGlobalFilter}
        initialState={{ globalFilter: 'kryptovaluta' }}
      >
        <Probe />
      </TableProvider>
    </NavigationProvider>
  )
}

describe('TableProvider serverSideGlobalFilter', () => {
  // The term matches none of the row values. Client side that empties the
  // table, which would throw away every hit the index matched on a field the
  // table has no column for - the inline article text being the whole point.
  it('keeps every fetched row when the search runs server side', () => {
    renderTable(true)
    expect(screen.getByTestId('rows')).toHaveTextContent('2')
  })

  it('still filters client side when the flag is not set', () => {
    renderTable(false)
    expect(screen.getByTestId('rows')).toHaveTextContent('0')
  })

  it('keeps the term in table state so the filter chip still renders', () => {
    renderTable(true)
    expect(screen.getByTestId('global-filter')).toHaveTextContent('kryptovaluta')
  })
})
