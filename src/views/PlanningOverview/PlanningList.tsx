import { useMemo, type JSX } from 'react'
import { Table } from '@/components/Table'
import { useQuery, useRegistry, useRepositorySocket } from '@/hooks'
import { getUTCDateRange } from '@/shared/datetime'
import type { ColumnDef } from '@tanstack/react-table'
import { TableSkeleton } from '@/components/Table/Skeleton'
import type { PreprocessedPlanningData } from './preprocessor'
import { preprocessPlanningData } from './preprocessor'
import { Error as ErrorView } from '../Error'
import { NewItems } from '@/components/Table/NewItems'
import { Toolbar } from '@/components/Table/Toolbar'

export const PlanningList = ({ columns }: {
  columns: ColumnDef<PreprocessedPlanningData>[]
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
    asTable: true,
    preprocessor: preprocessPlanningData
  })

  if (error) {
    console.error('Error fetching planning items:', error)
    return <ErrorView message='Kunde inte hämta planeringar' error={error} />
  }

  if (isLoading) {
    return <TableSkeleton columns={columns} />
  }

  return (
    <Table<PreprocessedPlanningData, unknown>
      columns={columns}
      resolveNavigation={(row) => ({
        id: row.id,
        opensWith: 'Planning'
      })}
    >

      <Toolbar />
      <NewItems.Root>
        <NewItems.Table
          header='Dina nya skapade planeringar'
          type='Planning'
        />
      </NewItems.Root>
    </Table>
  )
}
