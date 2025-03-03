import { useCallback } from 'react'
import { useQuery, useWireSources } from '@/hooks'

import { Table } from '@/components/Table'
import { useWires } from '@/hooks/index/useWires'
import type { Wire } from '@/hooks/index/lib/wires'
import type { ColumnDef } from '@tanstack/react-table'

export const WireList = ({ columns }: {
  columns: ColumnDef<Wire, unknown>[]
}): JSX.Element => {
  const [{ source, page }] = useQuery()

  const sourceUri = useWireSources()
    .filter((_) => Array.isArray(source)
      ? source.includes(_.title)
      : source === _.title)
    .map((_) => _.uri)

  useWires({
    source: sourceUri,
    page: typeof page === 'string'
      ? parseInt(page)
      : undefined
  })

  const onRowSelected = useCallback((row?: Wire) => {
    if (row) {
      console.info(`Selected planning item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])

  return (
    <Table
      type='Wires'
      columns={columns}
      onRowSelected={onRowSelected}
    />
  )
}
