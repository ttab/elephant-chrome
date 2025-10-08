import {
} from '@/lib/index'
import { useCallback } from 'react'
import { Table } from '@/components/Table'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/concepts'
import { fields } from '@/shared/schemas/conceptSchemas/sectionConcept'
import { useQuery } from '@/hooks/useQuery'
import { Toolbar } from './components/Toolbar'

import type { BaseConceptFields, Concept } from '@/shared/schemas/conceptSchemas/baseConcept'
export const ConceptList = ({ columns, documentType, title }: {
  columns: ColumnDef<Concept>[]
  documentType: string
  title: string
}): JSX.Element => {
  const [filter] = useQuery(['query'])
  const { error } = useDocuments<Concept, BaseConceptFields>({
    documentType: documentType,
    fields,
    query: constructQuery(filter),
    sort: [{ field: 'modified', desc: true }],
    options: {
      subscribe: true,
      setTableData: true
    }
  })

  const onRowSelected = useCallback((row?: Concept) => {
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
    <>
      <Table
        type='Concept'
        columns={columns}
        onRowSelected={onRowSelected}
      />
    </>
  )
}
