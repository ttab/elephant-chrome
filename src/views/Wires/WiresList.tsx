import { useCallback, useMemo } from 'react'
import { useQuery, useSections, useWireSources } from '@/hooks'

import { Table } from '@/components/Table'
import { wiresListColumns } from './WiresListColumns'
import useSWR from 'swr'
import { Wire } from '@/lib/index/schemas/wire'

export const WireList = (): JSX.Element => {
  const sections = useSections()
  const [{ source, page }] = useQuery()

  const sourceUri = useWireSources().filter((_) => _.title === source)[0]?.uri

  const { error } = useSWR<Wire[], Error>(['Wires', { source: sourceUri, size: 20, page }, { onePage: true }])
  const columns = useMemo(() => wiresListColumns({ sections }), [sections])

  const onRowSelected = useCallback((row?: Wire) => {
    if (row) {
      console.info(`Selected planning item ${row._id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])

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
