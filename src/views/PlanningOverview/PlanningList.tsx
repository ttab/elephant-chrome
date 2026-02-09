import { useCallback, useMemo, type JSX } from 'react'
import { Table } from '@/components/Table'
import { useQuery, useRegistry, useRepositorySocket } from '@/hooks'
import { toast } from 'sonner'
import { getUTCDateRange } from '../../../shared/datetime.js'
import type { DocumentState } from '@ttab/elephant-api/repositorysocket'
import type { ColumnDef } from '@tanstack/react-table'
import { TableSkeleton } from '@/components/Table/Skeleton.js'

export const PlanningList = ({ columns }: {
  columns: ColumnDef<DocumentState>[]
}): JSX.Element => {
  const [query] = useQuery()
  const { timeZone } = useRegistry()
  const { from, to } = useMemo(() =>
    getUTCDateRange(query?.from
      ? new Date(query?.from as string)
      : new Date(), timeZone), [query, timeZone])

  const { error, isLoading } = useRepositorySocket({
    type: 'core/planning-item',
    from,
    to,
    asTable: true
  })

  const onRowSelected = useCallback((row?: DocumentState) => {
    return row
  }, [])

  if (error) {
    console.error('Error fetching event items:', error)
    toast.error('Kunde inte hämta händelser')
  }

  if (isLoading) {
    return <TableSkeleton columns={columns} />
  }

  return (
    <Table
      type='Planning'
      columns={columns}
      onRowSelected={onRowSelected}
    />
  )
}
