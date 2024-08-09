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
import { planningTableColumns } from '@/views/PlanningOverview/PlanningTable/Columns'
import type { SearchIndexResponse, Planning } from '@/lib/index'
import { useSections } from '../hooks'

export interface CommandArgs {
  pages: string[]
  setPages: Dispatch<string[] | ((p: string[]) => string[])>
  page: string
  search: string | undefined
  setSearch: Dispatch<string | undefined>
}

export interface TableProviderState<TData> {
  table: Table<TData>
  setData: Dispatch<SearchIndexResponse<Planning>>
  loading: boolean
  command: CommandArgs
}

const initialState = {
  table: {},
  setData: () => { }
} as unknown as TableProviderState<Planning>

export const PlanningTableContext = createContext<TableProviderState<Planning>>(initialState)

export const PlanningTableProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [data, setData] = useState<SearchIndexResponse<Planning> | null>([] as unknown as SearchIndexResponse<Planning>)
  const sections = useSections()

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
    columns: planningTableColumns({ sections }),
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
    <PlanningTableContext.Provider value={{ table, setData, loading: !table.options.data.length, command }}>
      {children}
    </PlanningTableContext.Provider>
  )
}
