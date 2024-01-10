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
import { columns } from '@/views/PlanningOverview/PlanningTable/Columns'
import { type SearchIndexResponse } from '@/lib/index/search'
import type { Planning } from '../views/PlanningOverview/PlanningTable/data/schema'

export interface TableProviderState<TData> {
  table: Table<TData>
  setData: Dispatch<SearchIndexResponse>
  loading: boolean
  command: {
    pages: string[]
    setPages: Dispatch<string[] | ((p: string[]) => string[])>
    page: string
    search: string | undefined
    setSearch: Dispatch<string | undefined>
  }
}

const initialState = {
  table: {},
  setData: () => {}
} as unknown as TableProviderState<Planning>

export const TableContext = createContext<TableProviderState<Planning>>(initialState)

export const TableProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [data, setData] = useState<SearchIndexResponse | null>([] as unknown as SearchIndexResponse)

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
    <TableContext.Provider value={{ table, setData, loading: !data, command }}>
      {children}
    </TableContext.Provider>
  )
}
