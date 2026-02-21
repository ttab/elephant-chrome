import React, { type MouseEvent, type JSX } from 'react'
import { type ColumnDef, type Row as RowType } from '@tanstack/react-table'
import { GroupedRowsHeader } from './GroupedRowsHeader'
import { Row as RegularRow } from './Row'
import { WireRow } from './WireRow'
import type { TableRowData } from './types'
import { isWire } from '.'

export const GroupedRows = <TData extends TableRowData, TValue>({ row, columns, handleOpen, openDocuments, align }: {
  row: RowType<TData>
  columns: Array<ColumnDef<TData, TValue>>
  handleOpen: (event: MouseEvent<HTMLTableRowElement> | KeyboardEvent, subRow: RowType<TData>) => void
  openDocuments: string[]
  align?: 'start' | 'center'
}): JSX.Element => {
  if (!row.subRows.length) {
    return <></>
  }

  const Row = isWire(row.original) ? WireRow : RegularRow

  return (
    <React.Fragment key={row.id}>
      <GroupedRowsHeader row={row} columns={columns} />

      {row.subRows.map((subRow) => (
        <Row
          key={subRow.id}
          row={subRow}
          handleOpen={handleOpen}
          openDocuments={openDocuments}
          align={align}
        />
      ))}
    </React.Fragment>
  )
}
