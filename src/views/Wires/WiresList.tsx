import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useSections, useTable, useWireSources } from '@/hooks'

import { Table } from '@/components/Table'
import { wiresListColumns } from './WiresListColumns'
import useSWR from 'swr'
import { Wire } from '@/lib/index/schemas/wire'

export const WireList = (): JSX.Element => {
  const sections = useSections()
  const [{ source, page }] = useQuery()

  const sourceUri = useWireSources()
    .filter((_) => source?.includes(_.title))
    .map((_) => _.uri)

  const { error } = useSWR<Wire[], Error>(['Wires', { source: sourceUri, size: 47, page }])
  const columns = useMemo(() => wiresListColumns({ sections }), [sections])

  const onRowSelected = useCallback((row?: Wire) => {
    if (row) {
      console.info(`Selected planning item ${row._id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])

  const { table } = useTable()

  useEffect(() => {
    table.setGrouping(['issued'])
  }, [table])

  if (error) {
    return <pre>{error.message}</pre>
  }

  return (
    <Table
      type='Wires'
      columns={columns}
      onRowSelected={onRowSelected}
    />
  )
}
