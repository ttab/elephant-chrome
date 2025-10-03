import {
} from '@/lib/index'
import { useCallback } from 'react'
import { Table } from '@/components/Table'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/concepts'
import type { SectionConcept, SectionConceptFields } from '@/shared/schemas/conceptSchemas/sectionConcept'
import { fields } from '@/shared/schemas/conceptSchemas/sectionConcept'
export const ConceptList = ({ columns, documentType }: {
  columns: ColumnDef<SectionConcept>[]
  documentType: string
}): JSX.Element => {
  const { error, data } = useDocuments<SectionConcept, SectionConceptFields>({
    documentType: documentType,
    fields,
    query: constructQuery({}),
    sort: [{ field: 'modified', desc: true }],
    options: {
      subscribe: true,
      setTableData: true
    }
  })

  console.log(data)

  const onRowSelected = useCallback((row?: SectionConcept) => {
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
