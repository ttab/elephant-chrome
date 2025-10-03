import {
} from '@/lib/index'
import { useCallback } from 'react'
import { Table } from '@/components/Table'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { ColumnDef } from '@tanstack/react-table'
import { SortingV1 } from '@ttab/elephant-api/index'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/plannings'
import { toast } from 'sonner'
import type { Factbox, FactboxFields } from '@/shared/schemas/factbox.js'

export const ConceptList = ({ columns }: {
  columns: ColumnDef<Factbox>[]
}): JSX.Element => {
  const { error } = useDocuments<Factbox, FactboxFields>({
    documentType: 'core/story',
    query: constructQuery({}),
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

  const onRowSelected = useCallback((row?: Factbox) => {
    if (row) {
      console.info(`Selected concept item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])


  if (error) {
    console.error('Error fetching concept items:', error)
    toast.error('Kunde inte hämta concept')
  }


  return (
    <Table
      type='Concept'
      columns={columns}
      onRowSelected={onRowSelected}
    />
  )
}
