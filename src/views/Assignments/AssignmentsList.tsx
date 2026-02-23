import { useDateRange, useRepositorySocket } from '@/hooks'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { Error as ErrorView } from '../Error'
import { useMemo, type JSX } from 'react'
import { TableSkeleton } from '@/components/Table/Skeleton'
import type { PreprocessedAssignmentData } from './preprocessor'
import { createAssignmentPreprocessor } from './preprocessor'
import { Toolbar } from '@/components/Table/Toolbar'
import { SocketStatus } from '@/hooks/useRepositorySocket/lib/components/SocketStatus'

export const AssignmentsList = ({ columns }: {
  columns: ColumnDef<PreprocessedAssignmentData>[]
}): JSX.Element => {
  const { from, to } = useDateRange()

  const preprocessor = useMemo(
    () => createAssignmentPreprocessor({ gte: from, lte: to }),
    [from, to]
  )

  const { error, isLoading, status } = useRepositorySocket({
    type: 'core/planning-item',
    from,
    to,
    include: ['.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid:doc}'],
    asTable: true,
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
        id: row.document?.uuid || '',
        opensWith: 'Planning'
      })}
    >
      <SocketStatus status={status} />
      <Toolbar />
    </Table>
  )
}
