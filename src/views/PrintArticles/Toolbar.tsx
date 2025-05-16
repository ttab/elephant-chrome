import { Filter, type FilterProps } from '@/components/Filter'
import { SelectedFilters } from '@/components/Filter/SelectedFilters'
import { Commands } from './Commands'
import { useState } from 'react'

/**
 * Toolbar component.
 *
 * This component renders a toolbar with a button that currently triggers an alert
 * when clicked. The button is styled with a ghost variant and includes an icon
 * for filtering lists.
 *
 * @returns The rendered Toolbar component.
 *
 * @remarks
 * The component is designed to be sticky at the top of the page and includes
 * a border at the bottom. The button's functionality is not yet implemented.
 */


export const Toolbar = (): JSX.Element => {
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
    <div className='flex items-center justify-between py-1 px-4 border-b sticky top-0 bg-whitez-10'>
      <div className='flex flex-1 items-center space-x-2'>
        <Filter {...props}>
          <Commands {...props} />
        </Filter>
        <SelectedFilters />
      </div>
    </div>
  )
}
