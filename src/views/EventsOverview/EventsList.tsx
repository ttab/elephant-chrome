import { type JSX } from 'react'
import { Table } from '@/components/Table'
import { useDateRange, useRepositorySocket } from '@/hooks'
import type { ColumnDef } from '@tanstack/react-table'
import { TableSkeleton } from '@/components/Table/Skeleton'
import type { PreprocessedEventData } from './preprocessor'
import { preprocessEventData } from './preprocessor'
import { Error as ErrorView } from '../Error'
import { NewItems } from '@/components/Table/NewItems'
import { Toolbar } from '@/components/Table/Toolbar'
import { SocketStatus } from '@/hooks/useRepositorySocket/lib/components/SocketStatus'

export const EventsList = ({ columns }: {
  columns: ColumnDef<PreprocessedEventData>[]
}): JSX.Element => {
  const { from, to } = useDateRange()

  const { error, isLoading, status } = useRepositorySocket({
    type: 'core/event',
    from,
    to,
    asTable: true,
    preprocessor: preprocessEventData
  })


  if (error) {
    console.error('Error fetching events:', error)
    return <ErrorView message='Kunde inte hämta händelser' error={error} />
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
      <SocketStatus status={status} />
      <Toolbar />
      <NewItems.Root>
        <NewItems.Table
          header='Dina nya skapade händelser'
          type='Event'
        />
      </NewItems.Root>
    </Table>
  )
}
