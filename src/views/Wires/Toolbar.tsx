import { Save } from '@ttab/elephant-ui/icons'
import { SelectedFilters } from '@/components/Filter/SelectedFilters'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import type { FilterProps } from '@/components/Filter'
import { Filter } from '@/components/Filter'
import { Commands } from './Commands'
import { useState } from 'react'

export const Toolbar = (): JSX.Element => {
  const [pages, setPages] = useState<string[]>([])
  const [search, setSearch] = useState<string | undefined>('')

  const page = pages[pages.length - 1]

  const props: FilterProps = {
    page,
    pages,
    setPages,
    search,
    setSearch
  }

  return (
    <div className='flex items-center justify-between py-1 px-4 border-b sticky top-0 bg-white z-10'>
      <div className='flex flex-1 items-center space-x-2'>
        <Filter {...props}>
          <Commands {...props} />
        </Filter>
        <SelectedFilters />
      </div>
      <DotDropdownMenu
        trigger='vertical'
        items={[
          {
            label: 'Spara filter',
            icon: Save,
            item: () => {
              console.log('save wire search')
            }
          }
        ]}
      />
    </div>
  )
}
