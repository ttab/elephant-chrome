import {
} from '@/lib/index'
import { useCallback, useEffect } from 'react'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { Pagination } from '@/components/Table/Pagination'
import { useTable } from '@/hooks/useTable'
import type { IDBCategory, IDBConcept, IDBOrganiser, IDBSection, IDBStory } from 'src/datastore/types'
import type { ViewType } from '@/types/index'

export const ConceptList = ({ columns, type, data }: {
  columns: ColumnDef<IDBConcept>[]
  type: ViewType
  data: (IDBSection | IDBStory | IDBCategory | IDBOrganiser)[]
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
        type={type}
        columns={columns}
        onRowSelected={onRowSelected}
      />
      <Pagination total={data.length || 0} />
    </>
  )
}
