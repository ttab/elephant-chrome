import { X } from '@ttab/elephant-ui/icons'

import { Button, ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { SelectedFilters } from './SelectedFilters'
import { useFilter } from '@/hooks/useFilter'
import { useSections } from '@/hooks/useSections'

export const Toolbar = (): JSX.Element => {
  const [filters, setFilters] = useFilter(['status', 'section'])
  const isFiltered = Object.values(filters).some((value) => value.length)

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
        type='multiple'
        size='xs'
        value={filter.section || []}
        onValueChange={(value) => {
          setFilter({ ...filter, section: value })
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
    </div>
  )
}
