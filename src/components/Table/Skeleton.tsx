import { useEffect, useRef, useState, type JSX } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Table as _Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton
} from '@ttab/elephant-ui'

export const TableSkeleton = <TData,>({ columns, delay = 300 }: { columns: ColumnDef<TData>[], delay?: number }): JSX.Element | null => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rowCount, setRowCount] = useState(8)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [delay])

  useEffect(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.offsetHeight
      const rowHeight = 40
      setRowCount(Math.ceil(containerHeight / rowHeight))
    }
  }, [])

  if (!visible) {
    return null
  }

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
