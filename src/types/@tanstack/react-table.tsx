import { type RowData, type Column } from '@tanstack/react-table'
import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { type DefaultValueOption } from '..'
import { type SetStateAction, type Dispatch } from 'react'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    Filter?: (({ column, setSearch }: {
      column: Column<TData, TValue>
      setSearch: Dispatch<SetStateAction<string | undefined>>
    }) => JSX.Element)
    name: string
    columnIcon: LucideIcon
    options?: DefaultValueOption[]
    className: string
  }
}
