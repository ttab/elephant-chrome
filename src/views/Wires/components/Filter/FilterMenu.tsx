import { Popover, PopoverTrigger, Button, PopoverContent, Command, CommandItem, CommandList } from '@ttab/elephant-ui'
import { ListFilterIcon, ShapesIcon, SignalHighIcon, SquareCodeIcon, CheckIcon, CircleCheckIcon, SlidersHorizontalIcon } from '@ttab/elephant-ui/icons'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { useSections } from '@/hooks/useSections'
import { useWireSources } from '@/hooks/useWireSources'
import { Newsvalues } from '@/defaults/newsvalues'
import { cn } from '@ttab/elephant-ui/utils'
import { useTranslation } from 'react-i18next'
import { FreeTextFilter } from '@/components/Filter/common/FreeTextFilter'
import { AdvancedSearchDialog, createDefaultState, parseAdvancedSearchJson, wiresFields } from '@/components/AdvancedSearch'
import type { AdvancedSearchState } from '@/components/AdvancedSearch'

interface FilterPopoverProps {
  streamId: string
  currentFilters: Array<{ type: string, values: string[] }>
  onFilterChange: (type: string, values: string[]) => void
  editFilterType?: string
  onEditDone?: () => void
}

type FilterPage = '' | 'query' | 'section' | 'source' | 'newsvalue' | 'wireStatus'

const filterTypeToPage: Record<string, FilterPage> = {
  'core/section': 'section',
  'core/source': 'source',
  'core/newsvalue': 'newsvalue',
  wireStatus: 'wireStatus'
}

export const FilterMenu = ({ currentFilters, onFilterChange, editFilterType, onEditDone }: FilterPopoverProps): JSX.Element => {
  const { t } = useTranslation('wires')
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState<FilterPage>('')
  const [search, setSearch] = useState<string>('')
  const [queryInput, setQueryInput] = useState<string>('')
  const [advDialogOpen, setAdvDialogOpen] = useState(false)

  useEffect(() => {
    if (!editFilterType) return

    if (editFilterType === 'advancedSearch') {
      setAdvDialogOpen(true)
      onEditDone?.()
      return
    }

    const targetPage = filterTypeToPage[editFilterType]
    setPage(targetPage ?? '')
    setOpen(true)
    onEditDone?.()
  }, [editFilterType, onEditDone])

  const advFilterValue = currentFilters.find((f) => f.type === 'advancedSearch')?.values[0]
  const advancedState = useMemo((): AdvancedSearchState => {
    if (advFilterValue) {
      return parseAdvancedSearchJson(advFilterValue, 'FilterMenu', wiresFields) ?? createDefaultState(wiresFields)
    }
    return createDefaultState(wiresFields)
  }, [advFilterValue])

  function handleAdvancedApply(state: AdvancedSearchState) {
    onFilterChange('advancedSearch', [JSON.stringify(state)])
    onFilterChange('query', [])
  }

  function handleAdvancedClear() {
    onFilterChange('advancedSearch', [])
  }

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

  const optionsWireStatus = useMemo(() => [
    { value: 'read', label: t('history.status.read') },
    { value: 'saved', label: t('history.status.saved') },
    { value: 'used', label: t('history.status.used') },
    { value: 'flash', label: t('history.status.flash') }
  ], [t])

  // Get current filter values for the active page
  const getCurrentFilterValues = (filterType: string): Set<string> => {
    const filter = currentFilters.find((f) => f.type === filterType)
    return new Set(filter?.values || [])
  }

  const queryFilterValue = useMemo(() => {
    const filter = currentFilters.find((f) => f.type === 'query')
    return filter?.values?.[0] || ''
  }, [currentFilters])

  // Keep local query input in sync when filter changes externally
  useEffect(() => {
    setQueryInput(queryFilterValue)
  }, [queryFilterValue])

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
    setQueryInput('')
  }

  const handleBack = () => {
    setPage('')
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
  const currentInputValue = page === 'query' ? queryInput : search
  return (
    <>
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
            shouldFilter={page ? true : false}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (page) {
                  handleBack()
                } else {
                  setOpen(false)
                }
              }
              if (e.key === 'ArrowLeft' || (e.key === 'Backspace')) {
                if (queryInput || search || currentInputValue) {
                  e.stopPropagation()
                  return
                }
                if (page) {
                  e.preventDefault()
                  handleBack()
                } else {
                  setOpen(false)
                }
              }
            }}
          >
            {page
              && (
                <FreeTextFilter
                  value={search}
                  onChange={(value) => setSearch(value || '')}
                  filterType='filterOptions'
                />
              )}
            <CommandList>
              {!page
                && (
                  <FreeTextFilter
                    value={queryInput}
                    onChange={(value) => {
                      setQueryInput(value)
                      onFilterChange('query', value ? [value] : [])
                    }}
                    filterType='freetext'
                  />
                )}
              {!page && (
                <MenuList
                  onSelect={handleNavigateToPage}
                  onAdvancedSearch={() => {
                    setOpen(false)
                    setAdvDialogOpen(true)
                  }}
                />
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

              {page === 'wireStatus' && (
                <OptionsFilterList
                  options={filterOptions(optionsWireStatus)}
                  selectedValues={getCurrentFilterValues('wireStatus')}
                  onToggle={(value) => handleToggleOption('wireStatus', value)}
                />
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AdvancedSearchDialog
        open={advDialogOpen}
        onOpenChange={setAdvDialogOpen}
        fields={wiresFields}
        state={advancedState}
        onApply={handleAdvancedApply}
        onClear={handleAdvancedClear}
      />
    </>
  )
}

const MenuList = ({ onSelect, onAdvancedSearch }: {
  onSelect: (newPage: FilterPage) => void
  onAdvancedSearch: () => void
}) => {
  const { t } = useTranslation(['wires', 'core', 'common'])

  return (
    <>
      <CommandItem
        onSelect={() => onSelect('section')}
        className='flex gap-1 items-center'
      >
        <ShapesIcon size={18} strokeWidth={1.75} />
        {t('core:labels.section')}
      </CommandItem>
      <CommandItem
        onSelect={() => onSelect('source')}
        className='flex gap-1 items-center'
      >
        <SquareCodeIcon size={18} strokeWidth={1.75} />
        {t('wires:filter.sources')}
      </CommandItem>
      <CommandItem
        onSelect={() => onSelect('newsvalue')}
        className='flex gap-1 items-center'
      >
        <SignalHighIcon size={18} strokeWidth={1.75} />
        {t('wires:filter.newsvalue')}
      </CommandItem>
      <CommandItem
        onSelect={() => onSelect('wireStatus')}
        className='flex gap-1 items-center'
      >
        <CircleCheckIcon size={18} strokeWidth={1.75} />
        {t('wires:filter.wireStatus')}
      </CommandItem>
      <CommandItem
        onSelect={onAdvancedSearch}
        className='flex gap-1 items-center'
      >
        <SlidersHorizontalIcon size={18} strokeWidth={1.75} />
        {t('common:advancedSearch.title')}
      </CommandItem>
    </>
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
    <>
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
    </>
  )
}
