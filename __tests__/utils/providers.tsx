import { type PropsWithChildren, type ReactNode, useState, useMemo } from 'react'
import { SessionProvider as NextSessionProvider } from 'next-auth/react'
import {
  RegistryContext,
  type RegistryProviderState
} from '@/contexts/RegistryProvider'
import {
  CollaborationContext,
  type CollaborationProviderState
} from '@/contexts/CollaborationProvider'
import {
  TableContext,
  type TableProviderState
} from '@/contexts/TableProvider'
import type { YAwarenessUser } from '@/modules/yjs/hooks/useYAwareness'
import type { View } from '@/types'
import { defaultLocale } from '@/defaults/locale'
import { DEFAULT_TIMEZONE } from '@/defaults/defaultTimezone'
import { Repository } from '@/shared/Repository'
import { Workflow } from '@/shared/Workflow'
import { Index } from '@/shared/Index'
import { Spellchecker } from '@/shared/Spellchecker'
import { User } from '@/shared/User'
import { Baboon } from '@/shared/Baboon'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState
} from '@tanstack/react-table'


// ============================================================
// TestSessionProvider
// ============================================================

interface TestSessionUser {
  name: string
  email: string
  image: string
  id: string
  sub: string
}

interface TestSessionProviderProps extends PropsWithChildren {
  user?: Partial<TestSessionUser>
}

const defaultUser: TestSessionUser = {
  name: 'Test User',
  email: 'test@example.com',
  image: '',
  id: 'test-user-id',
  sub: 'test-user-sub'
}

export function TestSessionProvider({
  children,
  user = {}
}: TestSessionProviderProps): ReactNode {
  const mockSession = {
    expires: new Date(Date.now() + 86400000).toISOString(),
    user: { ...defaultUser, ...user },
    accessToken: 'mock-access-token',
    accessTokenExpires: Date.now() + 3600000,
    refreshToken: 'mock-refresh-token',
    status: 'authenticated' as const,
    error: ''
  }

  return (
    <NextSessionProvider
      session={mockSession}
      refetchOnWindowFocus={false}
      basePath='/elephant/api/auth'
    >
      {children}
    </NextSessionProvider>
  )
}


// ============================================================
// TestRegistryProvider
// ============================================================

type RegistryOverrides
  = Omit<Partial<RegistryProviderState>, 'server'>
    & { server?: Partial<RegistryProviderState['server']> }

interface TestRegistryProviderProps extends PropsWithChildren {
  overrides?: RegistryOverrides
}

const TEST_BASE = 'https://test.local'

const defaultServerUrls = {
  webSocketUrl: new URL(`${TEST_BASE}/ws`),
  indexUrl: new URL(`${TEST_BASE}/index`),
  repositoryEventsUrl: new URL(`${TEST_BASE}/events`),
  repositoryUrl: new URL(`${TEST_BASE}/repository`),
  contentApiUrl: new URL(`${TEST_BASE}/content`),
  spellcheckUrl: new URL(`${TEST_BASE}/spellcheck`),
  userUrl: new URL(`${TEST_BASE}/user`),
  faroUrl: new URL(`${TEST_BASE}/faro`),
  baboonUrl: new URL(`${TEST_BASE}/baboon`)
}

export function TestRegistryProvider({
  children,
  overrides = {}
}: TestRegistryProviderProps): ReactNode {
  const server = { ...defaultServerUrls, ...overrides.server }

  const state: RegistryProviderState = {
    locale: overrides.locale ?? defaultLocale,
    timeZone: overrides.timeZone ?? DEFAULT_TIMEZONE,
    server,
    repository: new Repository(server.repositoryUrl.href),
    workflow: new Workflow(server.repositoryUrl.href),
    index: new Index(server.indexUrl.href),
    spellchecker: new Spellchecker(server.spellcheckUrl.href),
    user: new User(server.userUrl.href),
    baboon: new Baboon(server.baboonUrl.href),
    dispatch: () => {},
    userColor: overrides.userColor ?? '#4f46e5'
  }

  return (
    <RegistryContext.Provider value={state}>
      {children}
    </RegistryContext.Provider>
  )
}


// ============================================================
// TestCollaborationProvider
// ============================================================

interface TestCollaborationProviderProps extends PropsWithChildren {
  documentId?: string
  connected?: boolean
  synced?: boolean
  user?: YAwarenessUser
}

export function TestCollaborationProvider({
  children,
  documentId = 'test-doc',
  connected = true,
  synced = true,
  user = { name: 'Test User', initials: 'TU', color: '#4f46e5' }
}: TestCollaborationProviderProps): ReactNode {
  const state: CollaborationProviderState = {
    provider: undefined,
    documentId,
    connected,
    synced,
    user
  }

  return (
    <CollaborationContext.Provider value={state}>
      {children}
    </CollaborationContext.Provider>
  )
}


// ============================================================
// TestTableProvider
// ============================================================

interface TestTableProviderProps<TData> extends PropsWithChildren {
  columns: Array<ColumnDef<TData, unknown>>
  data?: TData[]
  type?: View
}

export function TestTableProvider<TData>({
  children,
  columns,
  data = [],
  type = 'PlanningOverview' as View
}: TestTableProviderProps<TData>): ReactNode {
  const [tableData, setTableData] = useState<TData[]>(data)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [pages, setPages] = useState<string[]>([])
  const [search, setSearch] = useState<string | undefined>(undefined)

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const value = useMemo((): TableProviderState<TData> => ({
    table,
    setData: setTableData,
    loading: false,
    command: { pages, setPages, page: '', search, setSearch },
    type,
    filters: columnFilters,
    selectedRow: rowSelection
  }), [table, columnFilters, rowSelection, pages, search, type])

  return (
    <TableContext.Provider value={value as TableProviderState<unknown>}>
      {children}
    </TableContext.Provider>
  )
}
