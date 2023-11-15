'use client'

import { X as Cross2Icon } from '@ttab/elephant-ui/icons'
import { type Table } from '@tanstack/react-table'

import { Button, Input } from '@ttab/elephant-ui'
import { ViewOptions } from './ViewOptions'

import { priorities } from './data/data'
import { FacetedFilter } from './FacetedFilter'

interface ToolbarProps<TData> {
  table: Table<TData>
}

export const Toolbar = <TData,>({
  table
}: ToolbarProps<TData>): JSX.Element => {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter plannings..."
          value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('title')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('priority') && (
          <FacetedFilter
            column={table.getColumn('priority')}
            title="Priority"
            options={priorities}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <ViewOptions table={table} />
    </div>
  )
}
