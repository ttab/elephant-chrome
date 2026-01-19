import {
} from '@/lib/index'
import { type JSX, useCallback } from 'react'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { useQuery } from '@/hooks/useQuery'
import type { BaseConceptFields, Concept } from '@/shared/schemas/conceptSchemas/baseConcept'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/concepts'
import { SortingV1 } from '@ttab/elephant-api/index'
import { fields } from '@/shared/schemas/conceptSchemas/baseConcept'

export const ConceptList = ({ columns, documentType }: {
  columns: ColumnDef<Concept>[]
  documentType: string
}): JSX.Element => {
  const [filter] = useQuery(['query'])

  useDocuments<Concept, BaseConceptFields>({
    documentType,
    fields,
    query: constructQuery(filter),
    sort: [
      SortingV1.create({ field: 'document.title.sort' })
    ],
    options: {
      aggregatePages: true,
      setTableData: true,
      usableOnly: true
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


  return (
    <>
      <Table
        type='Concept'
        columns={columns}
        onRowSelected={onRowSelected}
        documentType={documentType}
      />
    </>
  )
}
