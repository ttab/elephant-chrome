import React, { type MouseEvent } from 'react'
import { type ColumnDef, type Row as RowType } from '@tanstack/react-table'
import { GroupedRowsHeader } from './GroupedRowsHeader'
import { Row as RegularRow } from './Row'
import { WireRow } from './WireRow'

export const GroupedRows = <TData, TValue>({ row, columns, handleOpen, openDocuments, type }: {
  row: RowType<unknown>
  type: 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires' | 'Factbox' | 'PrintArticles' | 'PrintEditor'
  columns: Array<ColumnDef<TData, TValue>>
  handleOpen: (event: MouseEvent<HTMLTableRowElement> | KeyboardEvent, subRow: RowType<unknown>) => void
  openDocuments: string[]
}): JSX.Element => {
  if (!row.subRows.length) {
    return <></>
  }

  const Row = type === 'Wires' ? WireRow : RegularRow

  return (
    <React.Fragment key={row.id}>
      <GroupedRowsHeader row={row} columns={columns} />

      {row.subRows.map((subRow) => (
        <Row
          key={subRow.id}
          type={type}
          row={subRow}
          handleOpen={handleOpen}
          openDocuments={openDocuments}
        />
      ))}
    </React.Fragment>
  )
}
