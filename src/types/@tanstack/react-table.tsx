import '@tanstack/react-table'
import { RowData } from '@tanstack/react-table'
import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { DefaultValueOption } from '..'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    filter: 'facet' | 'search' | null
    name: string
    columnIcon: LucideIcon
    options?: DefaultValueOption[]
    className: string
  }
}
