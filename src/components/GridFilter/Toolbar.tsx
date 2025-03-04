import { Save, X } from '@ttab/elephant-ui/icons'

import { Button, ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { SelectedFilters } from './SelectedFilters'
import { useFilter } from '@/hooks/useFilter'
import { useSections } from '@/hooks/useSections'
import { DotDropdownMenu } from '../ui/DotMenu'
import { useUserTracker } from '@/hooks/useUserTracker'

export const Toolbar = (): JSX.Element => {
  const [filters, setFilters] = useFilter(['status', 'section'])
  const isFiltered = Object.values(filters).some((value) => value.length)
  const [, setUserFilters] = useUserTracker(`filters.Approvals`)

  const [filter, setFilter] = useFilter(['section'])
  const allSections = useSections()

  return (
    <div className='flex items-center justify-between py-1 pr-2.5'>
      <div className='flex flex-1 items-center space-x-2'>
        <SelectedFilters />
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              setFilters({})
            }}
            className='h-8 px-2 lg:px-3'
          >
            Rensa
            <X size={18} strokeWidth={1.75} className='ml-2' />
          </Button>
        )}
      </div>
      <ToggleGroup
        type='single'
        size='xs'
        value={Array.isArray(filter.section) && filter.section.length === 1
          ? filter.section[0]
          : undefined}
        onValueChange={(value) => {
          setFilter({ ...filter, section: [value] })
        }}
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
      </ToggleGroup>
      <DotDropdownMenu
        trigger='vertical'
        items={[
          {
            label: 'Spara filter',
            icon: Save,
            item: () => {
              setUserFilters(filters)
            }
          }
        ]}
      />
    </div>
  )
}
