import { type RowData } from '@tanstack/react-table'
import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { type DefaultValueOption } from '..'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filter: 'facet' | 'search' | null
    name: string
    columnIcon: LucideIcon
    options?: DefaultValueOption[]
    className: string
  }
}
