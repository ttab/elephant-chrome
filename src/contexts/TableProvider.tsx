import { useState, createContext, type Dispatch, type PropsWithChildren } from 'react'
import {
  type Table,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { eventColumns } from '@/views/EventsOverview/EventsTable/Columns'
import { planningColumns } from '@/views/PlanningOverview/PlanningTable/Columns'
import { type SearchIndexResponse } from '@/lib/index/searchIndex'
// import { type Event } from '@/lib/index'

export interface CommandArgs {
  pages: string[]
  setPages: Dispatch<string[] | ((p: string[]) => string[])>
  page: string
  search: string | undefined
  setSearch: Dispatch<string | undefined>
}

export interface TableProviderState<TData> {
  table: Table<TData>
  setData: Dispatch<SearchIndexResponse<TData>>
  loading: boolean
  command: CommandArgs
}

const initialState = {
  table: {},
  setData: () => {}
} as unknown as TableProviderState<Event>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TableContext = createContext<TableProviderState<any>>(initialState)

interface TableProviderProps<TData> {
  type: 'planning' | 'events'
  data?: TData[]
}

export const TableProvider = <TData,>({
  children,
  type
}: PropsWithChildren<TableProviderProps<TData>>): JSX.Element => {
  const columns = type === 'events' ? eventColumns : planningColumns

  const [data, setData] = useState<SearchIndexResponse<TData> | null>([] as unknown as SearchIndexResponse<TData>)

  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const [pages, setPages] = useState<string[]>([])
  const page = pages[pages.length - 1]
  const [search, setSearch] = useState<string | undefined>()

  const command = {
    pages,
    setPages,
    page,
    setSearch,
    search
  }

  const table = useReactTable({
    data: data?.hits || [],
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters
    },
    enableRowSelection: true,
    enableMultiRowSelection: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  })

  return (
    <TableContext.Provider value={{ table, setData, loading: !table.options.data.length, command }}>
      {children}
    </TableContext.Provider>
  )
}
