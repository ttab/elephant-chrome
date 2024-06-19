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
import { columns } from '@/views/EventsOverview/EventsTable/Columns'
import { type EventsSearchIndexResponse } from '@/lib/index/events-search'
import { type Events } from '@/views/EventsOverview/EventsTable/data/schema'

export interface CommandArgs {
  pages: string[]
  setPages: Dispatch<string[] | ((p: string[]) => string[])>
  page: string
  search: string | undefined
  setSearch: Dispatch<string | undefined>
}

export interface TableProviderState<TData> {
  table: Table<TData>
  setData: Dispatch<EventsSearchIndexResponse>
  loading: boolean
  command: CommandArgs
}

const initialState = {
  table: {},
  setData: () => {}
} as unknown as TableProviderState<Events>

export const EventsTableContext = createContext<TableProviderState<Events>>(initialState)

export const EventsTableProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [data, setData] = useState<EventsSearchIndexResponse | null>([] as unknown as EventsSearchIndexResponse)

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
    <EventsTableContext.Provider value={{ table, setData, loading: !table.options.data.length, command }}>
      {children}
    </EventsTableContext.Provider>
  )
}
