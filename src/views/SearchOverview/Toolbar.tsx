import { Filter } from '@/components/Filter'
import { Commands } from './Commands'
import { useState } from 'react'
import type { FilterProps } from '@/components/Filter'
import { SelectedFilters } from '@/components/Filter/SelectedFilters'
import { Sort } from '@/components/Sort'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'

export const Toolbar = ({ type }: { type: SearchKeys }): JSX.Element => {
  const [pages, setPages] = useState<string[]>([])
  const [search, setSearch] = useState<string | undefined>('')

  const page = pages[pages.length - 1] || ''

  const props: FilterProps = {
    page,
    pages,
    setPages,
    search,
    setSearch
  }

  return (
    <div className='flex items-center justify-between py-1 px-4 border-b sticky top-0 bg-white z-10'>
      <Sort />
      <div className='flex flex-1 items-center space-x-2'>
        <Filter {...props}>
          <Commands {...props} type={type} />
        </Filter>
        <SelectedFilters />
      </div>
    </div>
  )
}
