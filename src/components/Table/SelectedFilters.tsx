import { type ReactNode } from 'react'
import { Badge, Button } from '@ttab/elephant-ui'
import { SearchIcon, XIcon } from '@ttab/elephant-ui/icons'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { type Table } from '@tanstack/react-table'
import { type DefaultValueOption } from '@/types/index'

interface SelectedBase {
  id: string
  value: unknown
}

const SelectedBadge = ({ value, options }: SelectedBase & {
  options: DefaultValueOption[] | undefined
}): ReactNode => {
  if (Array.isArray(value)) {
    if (value.length > 2) {
      return (
        <Badge
          variant='secondary'
          className='rounded-sm px-1 font-normal'
        >
          {value.length}
          {' '}
          valda
        </Badge>
      )
    } else {
      return value.map((v, index: number) => (
        <div key={index}>
          <Badge
            variant='secondary'
            className='rounded-sm px-1 font-normal mr-1 truncate whitespace-nowrap'
          >
            {typeof v === 'string' ? options?.find((option) => option.value === v)?.label || v : ''}
          </Badge>
        </div>
      ))
    }
  }
}

const SelectedButton = <TData, >({ id, value, table }: SelectedBase & {
  table: Table<TData>
}): React.ReactNode => {
  const FilterIcon = table.getColumn(id)?.columnDef.meta?.columnIcon
  const options = table.getColumn(id)?.columnDef.meta?.options

  return (
    <Button
      variant='outline'
      size='sm'
      className='h-8 border-dashed'
      onClick={() =>
        table.setColumnFilters(
          table.getState().columnFilters
            .filter((filter) => filter.id !== id))}
    >
      {FilterIcon && <FilterIcon size={18} strokeWidth={1.75} className='mr-2' />}
      <SelectedBadge id={id} value={value} options={options} />
      <XIcon size={18} strokeWidth={1.75} className='ml-2' />
    </Button>
  )
}

export const SelectedFilters = <TData, >({ table }: {
  table: Table<TData>
}): ReactNode => {
  const { columnFilters, globalFilter } = table.getState() as {
    columnFilters: ColumnFiltersState
    globalFilter: string | null
  }

  const GlobalFilter = globalFilter
    ? (
        <Button
          key='globalFilter'
          variant='outline'
          size='sm'
          className='h-8 border-dashed'
          onClick={() => table.resetGlobalFilter()}
        >
          <SearchIcon className='h4 w-4 mr-2' />
          {`"${globalFilter}"`}
          <XIcon className='h-4 w-4 ml-2' />
        </Button>
      )
    : null

  const ColumnFilters = columnFilters.map((filter, index) => (
    <SelectedButton key={index} id={filter.id} value={filter.value} table={table} />
  ))
  return (
    [ColumnFilters, GlobalFilter].filter((x) => x)
  )
}
