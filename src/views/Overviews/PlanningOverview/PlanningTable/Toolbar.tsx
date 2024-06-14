import { X } from '@ttab/elephant-ui/icons'
import { type Table } from '@tanstack/react-table'

import { Button } from '@ttab/elephant-ui'
import { SelectedFilters } from './SelectedFilters'

interface ToolbarProps<TData> {
  table: Table<TData>
}

export const Toolbar = <TData,>({
  table
}: ToolbarProps<TData>): JSX.Element => {
  const isFiltered = table.getState().columnFilters.length > 0 ||
    !!table.getState().globalFilter

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <SelectedFilters table={table} />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X size={18} strokeWidth={1.75} className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
