import { TableRow, TableCell } from '@ttab/elephant-ui'
import { useTable } from '@/hooks/useTable'
import { type ColumnDef, type Row } from '@tanstack/react-table'

export const GroupedRowsHeader = <TData, TValue>({ row, columns }: {
  row: Row<unknown>
  columns: Array<ColumnDef<TData, TValue>>
}): JSX.Element => {
  const { table } = useTable()
  const groupingValues = table.getState().grouping
  const groupingTitle = columns.find((column) => column.id === groupingValues[0])?.meta?.name

  return (
    <TableRow className='sticky top-0 bg-muted'>
      <TableCell colSpan={columns.length} className='pl-6 px-2 py-1 border-b'>
        <div className='flex justify-between items-center flex-wrap'>
          <div className='flex items-center space-x-2'>
            <span className='font-thin text-muted-foreground'>{groupingTitle}</span>
            <span className='inline-flex items-center justify-center size-5 bg-background rounded-full ring-1 ring-gray-300'>
              {row.groupingValue as string}
            </span>
          </div>
          <div className='flex items-center space-x-2 px-6'>
            <span className='font-thin text-muted-foreground'>Antal</span>
            <span className='inline-flex items-center justify-center size-5 bg-background rounded-full ring-1 ring-gray-300'>
              {row.subRows.length}
            </span>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}
