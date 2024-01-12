import { type ReactNode } from 'react'
import { Badge, Button } from '@ttab/elephant-ui'
import { Search, X } from '@ttab/elephant-ui/icons'
import { type Table } from '@tanstack/react-table'

interface SelectedBase {
  id: string
  value: unknown
}

interface SelectedButtonProps<TData> extends SelectedBase {
  table: Table<TData>
}

const SelectedBadge = ({ value }: SelectedBase): ReactNode => {
  if (Array.isArray(value)) {
    if (value.length > 2) {
      return (
        <Badge
          variant="secondary"
          className="rounded-sm px-1 font-normal"
      >
          {value.length} selected
        </Badge>
      )
    } else {
      return value.map((v, index: number) => (
        <div key={index}>
          <Badge
            variant="secondary"
            className="rounded-sm px-1 font-normal mr-1"
        >
            {typeof v === 'string' ? v : ''}
          </Badge>
        </div>
      ))
    }
  }
}

const SelectedButton = <TData, >({ id, value, table }: SelectedButtonProps<TData>): React.ReactNode => {
  const FilterIcon = table.getColumn(id)?.columnDef.meta?.columnIcon

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 border-dashed"
      onClick={() => table.resetColumnFilters()}
    >
      {FilterIcon && <FilterIcon className='h-4 w-4 mr-2' />}
      <SelectedBadge id={id} value={value} />
      <X className='h-4 w-4 ml-2'/>
    </Button>
  )
}

export const SelectedFilters = <TData, >({ table }: { table: Table<TData> }): ReactNode => {
  const { columnFilters, globalFilter } = table.getState()

  const GlobalFilter = globalFilter
    ? (
      <Button
        key='globalFilter'
        variant='outline'
        size='sm'
        className='h-8 border-dashed'
        onClick={() => table.resetGlobalFilter()}
      >
        <Search className='h4 w-4 mr-2' />
        {`"${globalFilter}"`}
        <X className='h-4 w-4 ml-2'/>
      </Button>)
    : null

  const ColumnFilters = columnFilters.map((filter, index) => (
    <SelectedButton key={index} id={filter.id} value={filter.value} table={table} />
  ))
  return [...ColumnFilters, GlobalFilter].filter(x => x)
}
