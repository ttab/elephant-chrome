import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useSections, useTable, useWireSources } from '@/hooks'

import { Table } from '@/components/Table'
import { wiresListColumns } from './WiresListColumns'
import { useWires } from '@/hooks/index/useWires'
import type { Wire } from '@/hooks/index/lib/wires'

export const WireList = (): JSX.Element => {
  const sections = useSections()
  const [{ source, page }] = useQuery()

  const sourceUri = useWireSources()
    .filter((_) => Array.isArray(source)
      ? source.includes(_.title)
      : source === _.title)
    .map((_) => _.uri)

  const columns = useMemo(() => wiresListColumns({ sections }), [sections])

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

  const { table } = useTable<Wire>()

  useEffect(() => {
    if (table) {
      table.setGrouping(['modified'])
    }
  }, [table])

  return (
    <Table
      type='Wires'
      columns={columns}
      onRowSelected={onRowSelected}
    />
  )
}
