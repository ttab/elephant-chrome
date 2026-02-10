import { CheckIcon } from '@ttab/elephant-ui/icons'
import { type Column } from '@tanstack/react-table'

import { cn } from '@ttab/elephant-ui/utils'
import { CommandItem } from '@ttab/elephant-ui'
import type { SetStateAction, Dispatch, JSX } from 'react'
import { useTranslation } from 'react-i18next'
import type { DefaultValueOption } from '@/types/index'

interface FacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  facetFn?: (() => Map<any, number>) | undefined
  setSearch: Dispatch<SetStateAction<string | undefined>>
}

export const FacetedFilter = <TData, TValue>({
  column,
  setSearch,
  facetFn = column?.getFacetedUniqueValues
}: FacetedFilterProps<TData, TValue>): JSX.Element[] => {
  const facets = facetFn?.()
  const selectedValues = new Set(column?.getFilterValue() as string[])
  const options = column?.columnDef.meta?.options
  const { t } = useTranslation()
  const getOptionLabel = (option: DefaultValueOption) => {
    switch (column?.id) {
      case 'documentStatus':
      case 'deliverableStatus':
        return t(`core:status.${option.value}`)
      case 'type':
      case 'assignmentType':
        return t(`shared:assignmentTypes.${option.value}`)
      case 'assignment_time':
        return t(`core:timeSlots.${option.value}`)
      default:
        return option.label
    }
  }

  return options
    ? options.map((option, index) => {
      const isSelected = selectedValues.has(option.value)
      return (
        <CommandItem
          key={`${option.value}-${index}`}
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
          <div className='flex items-center gap-2'>
            {option.icon && (
              <option.icon
                size={18}
                strokeWidth={1.75}
                color={option.iconProps?.color}
                className={option.iconProps?.className}
              />
            )}
            <span>{getOptionLabel(option)}</span>
          </div>
          <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
            {facets?.get(option.value) && (
              <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
                {facets.get(option.value) || 0}
              </span>
            )}
          </span>
        </CommandItem>
      )
    })
    : []
}
