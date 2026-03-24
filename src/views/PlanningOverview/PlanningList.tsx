import { useCallback, useMemo, type JSX } from 'react'

import { Table } from '@/components/Table'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { ColumnDef } from '@tanstack/react-table'
import type { Planning, PlanningFields } from '@/shared/schemas/planning'
import { fields } from '@/shared/schemas/planning'
import { SortingV1 } from '@ttab/elephant-api/index'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/plannings'
import { useQuery } from '@/hooks/useQuery'
import { getUTCDateRange } from '../../../shared/datetime.js'
import { toast } from 'sonner'
import { useRegistry } from '@/hooks/useRegistry'
import { useActivity } from '@/lib/documentActivity'

export const PlanningList = ({ columns }: {
  columns: ColumnDef<Planning>[]
}): JSX.Element => {
  const [query] = useQuery()
  const { timeZone } = useRegistry()
  const { from, to } = useMemo(() =>
    getUTCDateRange(query?.from ? new Date(query?.from as string) : new Date(), timeZone), [query, timeZone])

  const { error } = useDocuments<Planning, PlanningFields>({
    documentType: 'core/planning-item',
    query: constructQuery({ from, to }),
    fields,
    sort: [
      SortingV1.create({ field: 'document.meta.core_planning_item.data.start_date', desc: true }),
      SortingV1.create({ field: 'document.meta.core_newsvalue.value', desc: true })
    ],
    options: {
      aggregatePages: true,
      withStatus: true,
      setTableData: true,
      subscribe: true
    }
  })

  const open = useActivity('open', 'core/planning-item')

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
      onOpen={(event, id) => open?.executeEvent(id, event)}
    />
  )
}
