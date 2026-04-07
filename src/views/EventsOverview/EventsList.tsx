import { type JSX } from 'react'
import { Table } from '@/components/Table'
import { useDateRange, useRepositorySocket } from '@/hooks'
import type { ColumnDef } from '@tanstack/react-table'
import { TableSkeleton } from '@/components/Table/Skeleton'
import type { PreprocessedEventData } from './preprocessor'
import { preprocessEventData, EVENTS_SUBSET } from './preprocessor'
import { Error as ErrorView } from '../Error'
import { NewItems } from '@/components/Table/NewItems'
import { Toolbar } from '@/components/Table/Toolbar'
import { useTranslation } from 'react-i18next'

export const EventsList = ({ columns }: {
  columns: ColumnDef<PreprocessedEventData>[]
}): JSX.Element => {
  const { from, to } = useDateRange()
  const { t } = useTranslation()

  const { error, isLoading } = useRepositorySocket({
    type: 'core/event',
    from,
    to,
    subset: [...EVENTS_SUBSET],
    asTable: true,
    preprocessor: preprocessEventData
  })

  if (error) {
    console.error('Error fetching events:', error)
    return <ErrorView message={t('errors:toasts.getEventsFailed')} error={error} />
  }

  if (isLoading) {
    return <TableSkeleton columns={columns} />
  }

  return (
    <Table<PreprocessedEventData, unknown>
      columns={columns}
      resolveNavigation={(row) => ({
        id: row.id,
        opensWith: 'Event'
      })}
    >
      <Toolbar />
      <NewItems.Root>
        <NewItems.Table
          header={t('planning:yourNewType', { type: t('views:events.label.plural') })}
          type='Event'
        />
      </NewItems.Root>
    </Table>
  )
}
