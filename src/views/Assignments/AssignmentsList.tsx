import { useQuery, useRegistry, useRepositorySocket } from '@/hooks'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { Error as ErrorView } from '../Error'
import { useMemo, type JSX } from 'react'
import { TableSkeleton } from '@/components/Table/Skeleton'
import { getUTCDateRange } from '@/shared/datetime'
import { createStatusesDecorator, type StatusDecorator } from '@/hooks/useRepositorySocket/decorators/statuses'
import type { PreprocessedAssignmentData } from './preprocessor'
import { createAssignmentPreprocessor } from './preprocessor'
import { Toolbar } from '@/components/Table/Toolbar'

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

  const { error, isLoading } = useRepositorySocket<StatusDecorator>({
    type: 'core/planning-item',
    from,
    to,
    include,
    asTable: true,
    decorators,
    preprocessor
  })


  if (error) {
    console.error('Error fetching assignments:', error)
    return <ErrorView message='Kunde inte hämta uppdrag' error={error} />
  }

  if (isLoading) {
    return <TableSkeleton columns={columns} />
  }

  return (
    <Table<PreprocessedAssignmentData, unknown>
      columns={columns}
      rowAlign='start'
      resolveNavigation={(row) => ({
        id: row.id,
        opensWith: 'Planning'
      })}
    >
      <Toolbar />
    </Table>
  )
}
