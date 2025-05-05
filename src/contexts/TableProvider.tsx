import type {
  GlobalFilterTableState,
  TableState,
  Updater } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type Table,
  type VisibilityState
} from '@tanstack/react-table'
import {
  createContext,
  useMemo,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useCallback
} from 'react'
import { useQuery } from '../hooks'
import { updateFilter } from '@/lib/loadFilters'
import type { View } from '../types'

export interface CommandArgs {
  pages: string[]
  setPages: Dispatch<SetStateAction<string[]>>
  page: string
  search: string | undefined
  setSearch: Dispatch<SetStateAction<string | undefined>>
}

export interface TableProviderState<TData> {
  table: Table<TData>
  setData: Dispatch<TData[]>
  loading: boolean
  command: CommandArgs
  type: View
  filters: ColumnFiltersState
  selectedRow: Record<string, boolean>
}

const initialState = {
  table: {} as Table<unknown>,
  setData: () => {}
} as unknown as TableProviderState<unknown>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TableContext = createContext<TableProviderState<any>>(initialState)

export const TableProvider = <T,>({
  children,
  columns,
  type,
  initialState
}: PropsWithChildren<{
  columns: Array<ColumnDef<T, unknown>>
  type: View
  initialState?: Partial<TableState>
}>): JSX.Element => {
  const [data, setData] = useState<T[] | null>(null)

  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ startTime: false, modified: false, date: false })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialState?.columnFilters || [])
  const [sorting, setSorting] = useState<SortingState>([])

  const [pages, setPages] = useState<string[]>([])
  const page = pages[pages.length - 1]
  const [search, setSearch] = useState<string | undefined>()
  const [grouping, setGrouping] = useState<string[]>(initialState?.grouping || [])
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [globalFilter, setGlobalFilter] = useState<GlobalFilterTableState['globalFilter']>(initialState?.globalFilter)

  const [, setQuery] = useQuery()

  const command = useMemo(() => ({
    pages,
    setPages,
    page,
    setSearch,
    search
  }), [pages, page, search])

  const table = useReactTable({
    groupedColumnMode: false,
    data: data || [],
    columns,
    manualPagination: true,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      grouping,
      globalFilter: globalFilter as string
    },
    enableRowSelection: true,
    enableMultiRowSelection: false,
    enableSubRowSelection: true,
    enableSorting: true,
    onRowSelectionChange: useCallback(setRowSelection, [setRowSelection]),
    onGroupingChange: useCallback(setGrouping, [setGrouping]),
    onSortingChange: useCallback(setSorting, [setSorting]),
    onGlobalFilterChange: (updater: Updater<GlobalFilterTableState>) => {
      setQuery({ query: typeof updater === 'string'
        ? updater
        : undefined
      })
      setGlobalFilter(updater)
    },
    onColumnFiltersChange: useCallback((updater: Updater<ColumnFiltersState>) => {
      // Update query
      setQuery(updateFilter(updater, columnFilters))
      // Set filter in table
      setColumnFilters(updater)
    }, [setColumnFilters, setQuery, columnFilters]),
    onColumnVisibilityChange: useCallback(setColumnVisibility, [setColumnVisibility]),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getGroupedRowModel: getGroupedRowModel()
  })

  const value = useMemo(() => ({
    table,
    filters: columnFilters,
    sorting: sorting,
    selectedRow: rowSelection,
    setData,
    loading: data == null,
    type,
    command,
    grouping
  }), [table, columnFilters, rowSelection, command, data, type, sorting, grouping])

  return (
    <TableContext.Provider value={value}>
      {children}
    </TableContext.Provider>
  )
}
