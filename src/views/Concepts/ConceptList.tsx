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
import { useQuery } from '@/hooks/useQuery'
import { Toolbar } from './components/Toolbar'

export const ConceptList = ({ columns, documentType, title }: {
  columns: ColumnDef<SectionConcept>[]
  documentType: string
  title: string
}): JSX.Element => {
  const [filter] = useQuery(['query'])
  const { error } = useDocuments<SectionConcept, SectionConceptFields>({
    documentType: documentType,
    fields,
    query: constructQuery(filter),
    sort: [{ field: 'modified', desc: true }],
    options: {
      subscribe: true,
      setTableData: true
    }
  })

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
    <>
      <Toolbar placeholder={title} />
      <Table
        type='Concept'
        columns={columns}
        onRowSelected={onRowSelected}
      />
    </>
  )
}
