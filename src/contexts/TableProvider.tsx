import type {
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
  initialState
}: PropsWithChildren<{
  columns: Array<ColumnDef<T, unknown>>
  initialState?: Partial<TableState>
}>): JSX.Element => {
  const [data, setData] = useState<T[] | null>(null)

  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialState?.columnFilters || [])
  const [sorting, setSorting] = useState<SortingState>([])

  const [pages, setPages] = useState<string[]>([])
  const page = pages[pages.length - 1]
  const [search, setSearch] = useState<string | undefined>()
  const [grouping, setGrouping] = useState<string[]>(initialState?.grouping || [])

  const [, setQuery] = useQuery()

  const command = useMemo(() => ({
    pages,
    setPages,
    page,
    setSearch,
    search
  }), [pages, page, search])

  const table = useReactTable({
    data: data || [],
    columns,
    manualPagination: true,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      grouping
    },
    enableRowSelection: true,
    enableMultiRowSelection: false,
    enableSubRowSelection: true,
    onRowSelectionChange: useCallback(setRowSelection, [setRowSelection]),
    onGroupingChange: useCallback(setGrouping, [setGrouping]),
    onSortingChange: useCallback(setSorting, [setSorting]),
    onColumnFiltersChange: useCallback((updater: Updater<ColumnFiltersState>) => {
      const query = (typeof updater === 'function' ? updater([]) : updater).reduce<Record<string, string | string[] | undefined>>((acc, { id, value }) => {
        acc[id] = value as string | string[]
        return acc
      }, {})
      setQuery(query)
      setColumnFilters(updater)
    }, [setColumnFilters, setQuery]),
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
    selectedRow: rowSelection,
    setData,
    loading: data == null,
    command
  }), [table, columnFilters, rowSelection, command, data])

  return (
    <TableContext.Provider value={value}>
      {children}
    </TableContext.Provider>
  )
}
