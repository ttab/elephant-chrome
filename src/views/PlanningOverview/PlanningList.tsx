import {
} from '@/lib/index'
import { useCallback, useMemo } from 'react'

import { Table } from '@/components/Table'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { ColumnDef } from '@tanstack/react-table'
import type { Planning } from '@/hooks/index/useDocuments/schemas/planning'
import { fields } from '@/hooks/index/useDocuments/schemas/planning'
import { SortingV1 } from '@ttab/elephant-api/index'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/plannings'
import { useQuery } from '@/hooks/useQuery'
import { getDateTimeBoundariesUTC } from '@/lib/datetime'
import { toast } from 'sonner'

export const PlanningList = ({ columns }: {
  columns: ColumnDef<Planning>[]
}): JSX.Element => {
  const [query] = useQuery()
  const { from, to } = useMemo(() =>
    getDateTimeBoundariesUTC(typeof query.from === 'string'
      ? new Date(`${query.from}T00:00:00.000Z`)
      : new Date())
  , [query.from])

  const { error } = useDocuments({
    documentType: 'core/planning-item',
    size: 100, // TODO: use pagination
    query: constructQuery({ from, to }),
    fields,
    sort: [
      SortingV1.create({ field: 'document.meta.core_planning_item.data.start_date', desc: true }),
      SortingV1.create({ field: 'document.meta.core_newsvalue.value', desc: true })
    ],
    options: {
      allPages: true,
      withStatus: true
    }
  })

  const onRowSelected = useCallback((row?: Planning) => {
    if (row) {
      console.info(`Selected planning item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])


  if (error) {
    console.error('Error fetching planning items:', error)
    toast.error('Kunde inte hämta planeringar')
  }


  return (
    <Table
      type='Planning'
      columns={columns}
      onRowSelected={onRowSelected}
    />
  )
}
