import { Save, UserCog, X } from '@ttab/elephant-ui/icons'

import { Button, ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { SelectedFilters } from './SelectedFilters'
import type { Filter } from '@/hooks/useFilter'
import { useFilter } from '@/hooks/useFilter'
import { useSections } from '@/hooks/useSections'
import { DotDropdownMenu } from '../ui/DotMenu'
import { useUserTracker } from '@/hooks/useUserTracker'
import { toast } from 'sonner'
import type { QueryParams } from '@/hooks/useQuery'

export const Toolbar = (): JSX.Element => {
  const [filters, setFilters] = useFilter(['status', 'section'])
  const isFiltered = Object.values(filters).some((value) => value.length)
  const [userFilters, setUserFilters] = useUserTracker<QueryParams | undefined>(`filters.Approvals`)

  const isUserFilter = (savedUserFilter: QueryParams | undefined, currentFilter: Filter): boolean => {
    if (savedUserFilter === undefined) {
      return false
    }
    return JSON.stringify(savedUserFilter, Object.keys(savedUserFilter).sort()) === JSON.stringify(currentFilter, Object.keys(currentFilter).sort())
  }
  const [filter, setFilter] = useFilter(['section'])
  const allSections = useSections()

  const handleResetFilters = () => {
    setFilters({})
  }

  const handleSaveUserFilter = () => {
    setUserFilters(filters)

    toast.success('Ditt filter har sparats')
  }

  const handleToggleGroupValue = () => {
    if (isUserFilter(userFilters, filters)) {
      return 'user'
    }

    return Array.isArray(filter.section) && filter.section.length === 1
      ? filter.section[0]
      : undefined
  }

  const handleToggleValueChange = (value: string | undefined) => {
    if (value === 'user') {
      setFilter(userFilters as Filter || {})
      return
    }

    // TODO remove ''
    setFilter({ ...filter, section: [value || ''] })
  }

  return (
    <div className='flex flex-wrap flex-grow items-center space-x-2 border-b py-1 pr-2.5'>
      <SelectedFilters />
      {isFiltered && (
        <Button
          variant='ghost'
          onClick={handleResetFilters}
          className='h-8 px-2 lg:px-3'
        >
          Rensa
          <X size={18} strokeWidth={1.75} className='ml-2' />
        </Button>
      )}
      <div className='flex flex-row flex-grow flex-wrap items-center'>
        <div className='flex-grow'></div>
        <div className='hidden @2xl/view:flex'>
          <ToggleGroup
            type='single'
            size='xs'
            value={(() => handleToggleGroupValue())()}
            onValueChange={handleToggleValueChange}
            className='px-1'
          >
            {allSections.map((section) => (
              <ToggleGroupItem
                key={section.id}
                value={section.id}
                aria-label={`Toggle ${section.title}`}
                className='border data-[state=off]:text-muted-foreground'
              >
                {section.title}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem
              value='user'
              aria-label='Toggle user'
              className='border data-[state=off]:text-muted-foreground'
            >
              <UserCog size={18} strokeWidth={1.75} />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className='hidden @2xl/view:flex justify-end'>
          <DotDropdownMenu
            trigger='vertical'
            items={[
              {
                label: 'Spara personligt filter',
                icon: Save,
                item: handleSaveUserFilter
              }
            ]}
          />
        </div>
        <div className='flex justify-end @2xl/view:hidden'>
          <DotDropdownMenu
            trigger='vertical'
            items={[
              ...allSections.map((section) => ({
                label: section.title,
                item: () => {
                  // column?.setFilterValue([section.id])
                }
              })),
              {
                label: 'Personligt filter',
                icon: UserCog,
                item: () => {
                  setFilter(userFilters as Filter)
                }
              },
              {
                label: 'Spara personligt filter',
                icon: Save,
                item: handleSaveUserFilter
              }
            ]}
          />
        </div>
      </div>
    </div>
  )
}
