import {
} from '@/lib/index'
import { useCallback, useEffect } from 'react'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { useTable } from '@/hooks/useTable'
import type { IDBCategory, IDBConcept, IDBOrganiser, IDBSection, IDBStory } from 'src/datastore/types'

export const ConceptList = ({ columns, data, documentType }: {
  columns: ColumnDef<IDBConcept>[]
  data: (IDBSection | IDBStory | IDBCategory | IDBOrganiser)[]
  documentType: string
}): JSX.Element => {
  const { setData } = useTable<IDBSection | IDBStory | IDBCategory | IDBOrganiser>()

  useEffect(() => {
    setData(data)
  }, [data, setData])

  const onRowSelected = useCallback((row?: IDBConcept) => {
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
