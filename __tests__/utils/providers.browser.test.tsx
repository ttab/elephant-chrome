import { render } from 'vitest-browser-react'

import { expect, test } from 'vitest'
import { matchScreenshot } from './matchScreenshot'
import {
  TestSessionProvider,
  TestRegistryProvider,
  TestCollaborationProvider,
  TestTableProvider
} from './providers'
import { useRegistry } from '@/hooks/useRegistry'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useTable } from '@/hooks/useTable'
import { type ColumnDef } from '@tanstack/react-table'

// ============================================================
// TestSessionProvider tests
// ============================================================

test('TestSessionProvider renders children as authenticated', async () => {
  const { getByText } = await render(
    <TestSessionProvider>
      <div>Protected Content</div>
    </TestSessionProvider>
  )
  await expect.element(getByText('Protected Content')).toBeVisible()
})

// ============================================================
// TestRegistryProvider tests
// ============================================================

function RegistryConsumer() {
  const { server, locale, timeZone } = useRegistry()
  return (
    <div>
      <span>{`Index: ${server.indexUrl.href}`}</span>
      <span>{`Locale: ${locale.code.short}`}</span>
      <span>{`TZ: ${timeZone}`}</span>
    </div>
  )
}

test('TestRegistryProvider provides default values', async () => {
  const { getByText } = await render(
    <TestRegistryProvider>
      <RegistryConsumer />
    </TestRegistryProvider>
  )
  await expect.element(getByText(/Index: https:\/\/test\.local\/index/)).toBeVisible()
  await expect.element(getByText(/Locale: sv/)).toBeVisible()
  await expect.element(getByText(/TZ: Europe\/Stockholm/)).toBeVisible()
  await matchScreenshot(document.body)
})

test('TestRegistryProvider accepts server URL overrides', async () => {
  const { getByText } = await render(
    <TestRegistryProvider overrides={{
      server: { indexUrl: new URL('https://custom.test/index') }
    }}
    >
      <RegistryConsumer />
    </TestRegistryProvider>
  )
  await expect.element(getByText(/Index: https:\/\/custom\.test\/index/)).toBeVisible()
  await matchScreenshot(document.body)
})

// ============================================================
// TestCollaborationProvider tests
// ============================================================

function CollaborationConsumer() {
  const { connected, synced, documentId, user } = useCollaboration()
  return (
    <div>
      <span>{`Connected: ${String(connected)}`}</span>
      <span>{`Synced: ${String(synced)}`}</span>
      <span>{`DocId: ${documentId}`}</span>
      <span>{`User: ${user.name}`}</span>
    </div>
  )
}

test('TestCollaborationProvider provides connected state', async () => {
  const { getByText } = await render(
    <TestCollaborationProvider>
      <CollaborationConsumer />
    </TestCollaborationProvider>
  )
  await expect.element(getByText('Connected: true')).toBeVisible()
  await expect.element(getByText('Synced: true')).toBeVisible()
  await expect.element(getByText('DocId: test-doc')).toBeVisible()
  await expect.element(getByText('User: Test User')).toBeVisible()
  await matchScreenshot(document.body)
})

test('TestCollaborationProvider accepts custom props', async () => {
  const { getByText } = await render(
    <TestCollaborationProvider
      documentId='custom-doc'
      connected={false}
      user={{ name: 'Custom', initials: 'CU', color: '#ff0000' }}
    >
      <CollaborationConsumer />
    </TestCollaborationProvider>
  )
  await expect.element(getByText('Connected: false')).toBeVisible()
  await expect.element(getByText('DocId: custom-doc')).toBeVisible()
  await expect.element(getByText('User: Custom')).toBeVisible()
  await matchScreenshot(document.body)
})

// ============================================================
// TestTableProvider tests
// ============================================================

interface SimpleRow {
  id: string
  title: string
}

const simpleColumns: Array<ColumnDef<SimpleRow, unknown>> = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'title', header: 'Title' }
]

function TableConsumer() {
  const { table, loading } = useTable<SimpleRow>()
  const rows = table.getRowModel().rows
  return (
    <div>
      <span>{`Loading: ${String(loading)}`}</span>
      <span>{`Rows: ${rows.length}`}</span>
      {rows.map((row) => (
        <span key={row.id}>{`Row: ${row.original.title}`}</span>
      ))}
    </div>
  )
}

test('TestTableProvider renders with data', async () => {
  const data: SimpleRow[] = [
    { id: '1', title: 'First' },
    { id: '2', title: 'Second' }
  ]

  const { getByText } = await render(
    <TestTableProvider columns={simpleColumns} data={data}>
      <TableConsumer />
    </TestTableProvider>
  )
  await expect.element(getByText('Loading: false')).toBeVisible()
  await expect.element(getByText('Rows: 2')).toBeVisible()
  await expect.element(getByText('Row: First')).toBeVisible()
  await expect.element(getByText('Row: Second')).toBeVisible()
  await matchScreenshot(document.body)
})

test('TestTableProvider works with empty data', async () => {
  const { getByText } = await render(
    <TestTableProvider columns={simpleColumns}>
      <TableConsumer />
    </TestTableProvider>
  )
  await expect.element(getByText('Rows: 0')).toBeVisible()
  await matchScreenshot(document.body)
})
