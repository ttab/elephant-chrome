import { useQuery, useRegistry, useRepositorySocket } from '@/hooks'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { Error as ErrorView } from '../Error'
import { useCallback, useMemo, type JSX } from 'react'
import { TableSkeleton } from '@/components/Table/Skeleton'
import { getUTCDateRange } from '@/shared/datetime'
import { createStatusesDecorator, type StatusDecorator } from '@/hooks/useRepositorySocket/decorators/statuses'
import type { PreprocessedAssignmentData } from './preprocessor'
import { createAssignmentPreprocessor } from './preprocessor'
import { SocketStatus } from '@/hooks/useRepositorySocket/lib/components/SocketStatus'

export const AssignmentsList = ({ columns }: {
  columns: ColumnDef<PreprocessedAssignmentData>[]
}): JSX.Element => {
  const [query] = useQuery()
  const { timeZone, repository } = useRegistry()
  const { from, to } = useMemo(() =>
    getUTCDateRange(query?.from
      ? new Date(query?.from as string)
      : new Date(), timeZone), [query, timeZone])

  const include = useMemo(() => {
    return ['.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid:doc}']
  }, [])

  const decorators = useMemo(() => {
    if (!repository) return
    return [
      createStatusesDecorator({
        repository
      })
    ]
  }, [repository])

  const preprocessor = useMemo(
    () => createAssignmentPreprocessor({ gte: from, lte: to }),
    [from, to]
  )

  const { error, isLoading, status } = useRepositorySocket<StatusDecorator>({
    type: 'core/planning-item',
    from,
    to,
    include,
    asTable: true,
    decorators,
    preprocessor
  })

  const onRowSelected = useCallback((row?: PreprocessedAssignmentData) => {
    return row
  }, [])

  if (error) {
    console.error('Error fetching assignments:', error)
    return <ErrorView message='Kunde inte hämta uppdrag' error={error} />
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
