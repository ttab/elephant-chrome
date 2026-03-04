import { Popover, PopoverTrigger, Button, PopoverContent, Command, CommandList, CommandItem } from '@ttab/elephant-ui'
import { ListFilterIcon, BinocularsIcon, ShapesIcon, SignalHighIcon, SquareCodeIcon, CheckIcon } from '@ttab/elephant-ui/icons'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { useSections } from '@/hooks/useSections'
import { useWireSources } from '@/hooks/useWireSources'
import { Newsvalues } from '@/defaults/newsvalues'
import { cn } from '@ttab/elephant-ui/utils'

interface FilterPopoverProps {
  streamId: string
  currentFilters: Array<{ type: string, values: string[] }>
  onFilterChange: (type: string, values: string[]) => void
}

type FilterPage = '' | 'query' | 'section' | 'source' | 'newsvalue'

export const FilterMenu = ({ currentFilters, onFilterChange }: FilterPopoverProps): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState<FilterPage>('')
  const [search, setSearch] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sections = useSections({ sort: 'title' })
  const wireSources = useWireSources({ sort: 'title' })

  const optionsSections = useMemo(() => sections.map((_) => ({
    value: _.id,
    label: _.title
  })), [sections])

  const optionsSources = useMemo(() => wireSources.map(({ uri, title }) => ({
    value: uri,
    label: title
  })), [wireSources])

  const optionsNewsvalues = useMemo(() => Newsvalues.map((nv) => ({
    value: nv.value,
    label: nv.label
  })), [])

  // Get current filter values for the active page
  const getCurrentFilterValues = (filterType: string): Set<string> => {
    const filter = currentFilters.find((f) => f.type === filterType)
    return new Set(filter?.values || [])
  }

  const queryFilterValue = useMemo(() => {
    const filter = currentFilters.find((f) => f.type === 'query')
    return filter?.values?.[0] || ''
  }, [currentFilters])

  useEffect(() => {
    if (inputRef.current && open) {
      inputRef.current.focus()
    }
  }, [page, open])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPage('')
      setSearch('')
    }
    setOpen(newOpen)
  }

  const handleNavigateToPage = (newPage: FilterPage) => {
    setPage(newPage)
    setSearch('')
  }

  const handleBack = () => {
    setPage('')
    setSearch('')
  }

  const handleQuerySubmit = () => {
    const value = inputRef.current?.value?.trim() || ''
    onFilterChange('query', value ? [value] : [])
  }

  const handleToggleOption = (filterType: string, value: string) => {
    const selected = getCurrentFilterValues(filterType)

    if (selected.has(value)) {
      selected.delete(value)
    } else {
      selected.add(value)
    }

    const newValues = Array.from(selected)
    onFilterChange(filterType, newValues)
  }

  const filterOptions = (options: Array<{ value: string, label: string }>) => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchLower)
      || opt.value.toLowerCase().includes(searchLower)
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='xs'
          role='combobox'
          aria-expanded={open}
          className='h-9 w-9'
        >
          <ListFilterIcon
            size={18}
            strokeWidth={1.75}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-50 p-0' align='start'>
        <Command
          onKeyDown={(e) => {
            if (e.key === 'Enter' && page === 'query') {
              handleQuerySubmit()
            }
            if (e.key === 'Escape') {
              if (page) {
                handleBack()
              } else {
                setOpen(false)
              }
            }
            if (e.key === 'ArrowLeft' || (e.key === 'Backspace' && !inputRef.current?.value)) {
              e.preventDefault()
              if (page) {
                handleBack()
              } else {
                setOpen(false)
              }
            }
          }}
        >
          <DebouncedCommandInput
            ref={inputRef}
            value={page === 'query' ? queryFilterValue : search}
            onChange={(value) => {
              if (page === 'query') {
                // Don't debounce for query filter - handle on Enter
              } else {
                setSearch(value || '')
              }
            }}
            placeholder={page === 'query' ? 'Fritext' : 'Sök alternativ'}
            className='h-9'
          />

          {!page && (
            <CommandList>
              <CommandItem
                onSelect={() => handleNavigateToPage('query')}
                className='flex gap-1 items-center'
              >
                <BinocularsIcon size={18} strokeWidth={1.75} />
                Fritext
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigateToPage('section')}
                className='flex gap-1 items-center'
              >
                <ShapesIcon size={18} strokeWidth={1.75} />
                Sektion
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigateToPage('source')}
                className='flex gap-1 items-center'
              >
                <SquareCodeIcon size={18} strokeWidth={1.75} />
                Källor
              </CommandItem>
              <CommandItem
                onSelect={() => handleNavigateToPage('newsvalue')}
                className='flex gap-1 items-center'
              >
                <SignalHighIcon size={18} strokeWidth={1.75} />
                Nyhetsvärde
              </CommandItem>
            </CommandList>
          )}

          {page === 'section' && (
            <OptionsFilterList
              options={filterOptions(optionsSections)}
              selectedValues={getCurrentFilterValues('core/section')}
              onToggle={(value) => handleToggleOption('core/section', value)}
            />
          )}

          {page === 'source' && (
            <OptionsFilterList
              options={filterOptions(optionsSources)}
              selectedValues={getCurrentFilterValues('core/source')}
              onToggle={(value) => handleToggleOption('core/source', value)}
            />
          )}

          {page === 'newsvalue' && (
            <OptionsFilterList
              options={filterOptions(optionsNewsvalues)}
              selectedValues={getCurrentFilterValues('core/newsvalue')}
              onToggle={(value) => handleToggleOption('core/newsvalue', value)}
            />
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const OptionsFilterList = ({
  options,
  selectedValues,
  onToggle
}: {
  options: Array<{ value: string, label: string }>
  selectedValues: Set<string>
  onToggle: (value: string) => void
}): JSX.Element => {
  return (
    <CommandList>
      {options.map((option) => {
        const isSelected = selectedValues.has(option.value)

        return (
          <CommandItem
            className='flex gap-1 items-center'
            key={option.value}
            onSelect={() => onToggle(option.value)}
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
            <span>{option.label}</span>
          </CommandItem>
        )
      })}
    </CommandList>
  )
}
