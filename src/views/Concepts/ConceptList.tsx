import {
} from '@/lib/index'
import { useCallback } from 'react'
import { Table } from '@/components/Table'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import type { Factbox, FactboxFields } from '@/shared/schemas/factbox.js'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/concepts'

export const ConceptList = ({ columns, documentType }: {
  columns: ColumnDef<Factbox>[]
  documentType: string
}): JSX.Element => {
  const { error, data } = useDocuments<Factbox, FactboxFields>({
    documentType: 'core/section',
    query: constructQuery({}),
    options: { 
      aggregatePages: true,
      withStatus: true,
      setTableData: true,
      subscribe: true
    }
  })

  console.log(data)

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
