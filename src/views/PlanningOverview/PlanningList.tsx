import { useCallback, useMemo, type JSX } from 'react'
import { Table } from '@/components/Table'
import { useQuery, useRegistry, useRepositorySocket } from '@/hooks'
import { getUTCDateRange } from '@/shared/datetime'
import type { DocumentState } from '@ttab/elephant-api/repositorysocket'
import type { ColumnDef } from '@tanstack/react-table'
import { TableSkeleton } from '@/components/Table/Skeleton'
import type { PreprocessedPlanningData } from './preprocessor'
import { preprocessPlanningData } from './preprocessor'
import { Error as ErrorView } from '../Error'
import { SocketStatus } from '@/hooks/useRepositorySocket/lib/components/SocketStatus'

export const PlanningList = ({ columns }: {
  columns: ColumnDef<PreprocessedPlanningData>[]
}): JSX.Element => {
  const [query] = useQuery()
  const { timeZone } = useRegistry()
  const { from, to } = useMemo(() =>
    getUTCDateRange(query?.from
      ? new Date(query?.from as string)
      : new Date(), timeZone), [query, timeZone])

  const { error, isLoading, status } = useRepositorySocket({
    type: 'core/planning-item',
    from,
    to,
    asTable: true,
    preprocessor: preprocessPlanningData
  })

  const onRowSelected = useCallback((row?: DocumentState) => {
    return row
  }, [])

  if (error) {
    console.error('Error fetching planning items:', error)
    return <ErrorView message='Kunde inte hämta planeringar' error={error} />
  }

  if (isLoading) {
    return <TableSkeleton columns={columns} />
  }

  return (
    <Table
      type='Planning'
      columns={columns}
      onRowSelected={onRowSelected}
    >
      <SocketStatus status={status} />
    </Table>
  )
}
