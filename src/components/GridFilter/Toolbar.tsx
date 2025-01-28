import { X } from '@ttab/elephant-ui/icons'

import { Button } from '@ttab/elephant-ui'
import { SelectedFilters } from './SelectedFilters'
import { useFilter } from '@/hooks/useFilter'

export const Toolbar = (): JSX.Element => {
  const [filters, setFilters] = useFilter(['status', 'section'])
  const isFiltered = Object.values(filters).some((value) => value.length)

  return (
    <div className='flex items-center justify-between'>
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
    </div>
  )
}
