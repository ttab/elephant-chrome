import React, { type MouseEvent } from 'react'
import { type ColumnDef, type Row as RowType } from '@tanstack/react-table'
import { GroupedRowsHeader } from './GroupedRowsHeader'
import { Row } from './Row'

export const GroupedRows = <TData, TValue>({ row, columns, handleOpen, openDocuments, type }: {
  row: RowType<unknown>
  type: 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires'
  columns: Array<ColumnDef<TData, TValue>>
  handleOpen: (event: MouseEvent<HTMLTableRowElement> | KeyboardEvent, subRow: RowType<unknown>) => void
  openDocuments: string[]
}): JSX.Element => {
  if (!row.subRows.length) {
    return <></>
  }

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
