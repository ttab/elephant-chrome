import { useDateRange, useRepositorySocket } from '@/hooks'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { Error as ErrorView } from '../Error'
import { type JSX } from 'react'
import { TableSkeleton } from '@/components/Table/Skeleton'
import type { PreprocessedLatestData, LatestDecorator } from './preprocessor'
import { preprocessLatestData, LATEST_SUBSET } from './preprocessor'
import { Toolbar } from '@/components/Table/Toolbar'

export const LatestList = ({ columns }: {
  columns: ColumnDef<PreprocessedLatestData>[]
}): JSX.Element => {
  const { from, to } = useDateRange()

  const { error, isLoading } = useRepositorySocket<LatestDecorator>({
    type: 'core/planning-item',
    from,
    to,
    include: ['.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid:doc}'],
    subset: [...LATEST_SUBSET],
    asTable: true,
    preprocessor: preprocessLatestData
  })

  if (error) {
    console.error('Error fetching latest:', error)
    return <ErrorView message='Kunde inte hämta senast utgivet' error={error} />
  }

  if (isLoading) {
    return <TableSkeleton columns={columns} />
  }

  return (
    <Table<PreprocessedLatestData, unknown>
      columns={columns}
      resolveNavigation={(row) => ({
        id: row.id,
        version: row._preprocessed.deliverableVersion,
        opensWith: row._preprocessed.deliverableType === 'core/flash' ? 'Flash' : 'Editor'
      })}
    >
      <Toolbar />
    </Table>
  )
}
