import {
} from '@/lib/index'
import { type JSX, useCallback } from 'react'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import type { BaseConceptFields, Concept } from '@/shared/schemas/conceptSchemas/baseConcept'
import { useDocuments } from '@/hooks/index/useDocuments'
import { SortingV1 } from '@ttab/elephant-api/index'
import { fields } from '@/shared/schemas/conceptSchemas/baseConcept'

export const ConceptList = ({ columns, documentType }: {
  columns: ColumnDef<Concept>[]
  documentType: string
}): JSX.Element => {
  useDocuments<Concept, BaseConceptFields>({
    documentType,
    fields,
    sort: [
      SortingV1.create({ field: 'document.title.sort' })
    ],
    options: {
      aggregatePages: true,
      setTableData: true,
      usableOnly: true
    }
  })

  const onRowSelected = useCallback((row?: Concept) => row, [])

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
