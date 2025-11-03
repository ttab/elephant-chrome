import {
} from '@/lib/index'
import { useCallback } from 'react'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { Pagination } from '@/components/Table/Pagination'
import { useTable } from '@/hooks/useTable'
import type { IDBCategory, IDBConcept, IDBOrganiser, IDBSection, IDBStory } from 'src/datastore/types'
import type { ViewType } from '@/types/index'

export const ConceptList = ({ columns, type, conceptData }: {
  columns: ColumnDef<IDBConcept>[]
  type: ViewType
  conceptData: (IDBSection | IDBStory | IDBCategory | IDBOrganiser)[]
}): JSX.Element => {
  const { setData } = useTable<IDBSection | IDBStory | IDBCategory | IDBOrganiser>()

  const onRowSelected = useCallback((row?: IDBConcept) => {
    if (row) {
      console.info(`Selected concept item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])

  setData(conceptData)

  return (
    <>
      <Table
        type={type}
        columns={columns}
        onRowSelected={onRowSelected}
      />
      <Pagination total={conceptData.length || 0} />
    </>
  )
}
