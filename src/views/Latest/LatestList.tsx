import { useRegistry, useRepositorySocket } from '@/hooks'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { Error as ErrorView } from '../Error'
import { useCallback, useMemo, type JSX } from 'react'
import { TableSkeleton } from '@/components/Table/Skeleton'
import type { PreprocessedLatestData, LatestDecorator } from './preprocessor'
import { latestPreprocessor } from './preprocessor'
import { getUTCDateRange } from '@/shared/datetime'
import { Toolbar } from '@/components/Table/Toolbar'

export const LatestList = ({ columns }: {
  columns: ColumnDef<PreprocessedLatestData>[]
}): JSX.Element => {
  const { timeZone } = useRegistry()

  const { from, to } = useMemo(() =>
    getUTCDateRange(new Date(), timeZone), [timeZone])

  const include = useMemo(() => {
    return ['.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid:doc}']
  }, [])

  const { error, isLoading } = useRepositorySocket<LatestDecorator>({
    type: 'core/planning-item',
    from,
    to,
    include,
    asTable: true,
    preprocessor: latestPreprocessor
  })

  const onRowSelected = useCallback((row?: PreprocessedLatestData) => {
    return row
  }, [])

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
      onRowSelected={onRowSelected}
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
