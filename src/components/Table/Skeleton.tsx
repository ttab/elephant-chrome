import { useEffect, useRef, useState, type JSX } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { DocumentState } from '@ttab/elephant-api/repositorysocket'
import {
  Table as _Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton
} from '@ttab/elephant-ui'

export const TableSkeleton = ({ columns }: { columns: ColumnDef<DocumentState>[] }): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rowCount, setRowCount] = useState(8) // default fallback

  useEffect(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.offsetHeight
      const rowHeight = 40
      setRowCount(Math.ceil(containerHeight / rowHeight))
    }
  }, [])

  return (
    <div ref={containerRef} className='h-screen'>
      <_Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.meta?.className}>
                <Skeleton className='h-4 w-20' />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className='h-10 w-full' />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </_Table>
    </div>
  )
}
