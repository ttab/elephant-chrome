import type { ViewMetadata } from '@/types/index'
import { useCallback, useEffect } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { IDBAdmin } from 'src/datastore/types'
import { Table } from '@/components/Table'
import { tableDataMap } from '../Concepts/lib/conceptDataTable'
import { useTable } from '@/hooks/useTable'

const meta: ViewMetadata = {
  name: 'Concepts',
  path: `${import.meta.env.BASE_URL}/concepts`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const ConceptOverview = ({ columns }: {
  columns: ColumnDef<IDBAdmin>[]
}) => {
  const data = Object.values(tableDataMap).map(({ label, description, documentType }) => ({ title: label, description: description, documentType: documentType }))
  const { setData } = useTable<IDBAdmin>()

  useEffect(() => {
    setData(data)
  }, [])

  const onRowSelected = useCallback((row?: IDBAdmin) => {
    if (row) {
      console.info(`Selected concept item ${row.title}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])

  return (
    <>
      <Table
        type='Admin'
        columns={columns}
        onRowSelected={onRowSelected}
        searchType='Concepts'
      />
    </>
  )
}

ConceptOverview.meta = meta
