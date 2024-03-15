
import { CheckIcon } from '@ttab/elephant-ui/icons'
import { type Column } from '@tanstack/react-table'

import { cn } from '@ttab/elephant-ui/utils'
import { CommandItem } from '@ttab/elephant-ui'
import { type Dispatch } from 'react'

interface FacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  setSearch: Dispatch<string>
}

export const FacetedFilter = <TData, TValue>({
  column,
  setSearch
}: FacetedFilterProps<TData, TValue>): JSX.Element[] => {
  const facets = column?.getFacetedUniqueValues()
  const selectedValues = new Set(column?.getFilterValue() as string[])
  const options = column?.columnDef.meta?.options

  return options
    ? options.map((option) => {
      const isSelected = selectedValues.has(option.value)
      return (
        <CommandItem
          key={option.value}
          onSelect={() => {
            if (isSelected) {
              selectedValues.delete(option.value)
            } else {
              selectedValues.add(option.value)
            }
            const filterValues = Array.from(selectedValues)
            column?.setFilterValue(
              filterValues.length ? filterValues : undefined
            )
            setSearch('')
          }}
        >
          <div
            className={cn(
              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'opacity-50 [&_svg]:invisible'
            )}
          >
            <CheckIcon size={18} strokeWidth={1.75} />
          </div>
          {option.icon && (
            <option.icon size={18} strokeWidth={1.75} />
          )}
          <span>{option.label}</span>
          {(
            <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
              {facets?.get(option.value) && (
                <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                  {facets.get(option.value) || 0}
                </span>
              )}
            </span>
          )}
        </CommandItem>
      )
    })
    : []
}
