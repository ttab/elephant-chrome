import type { JSX, MouseEvent } from 'react'
import { Button } from '@ttab/elephant-ui'
import { SearchIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'
import { useLink } from '@/hooks/useLink'
import type { ViewProps } from '@/types'

export const SearchLink = ({ searchType }: {
  searchType: string
}): JSX.Element => {
  const { t } = useTranslation()
  const openSearch = useLink('Search')

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    openSearch(e, { type: searchType } as unknown as ViewProps)
  }

  return (
    <Button
      variant='ghost'
      size='xs'
      className='h-9 w-9'
      title={t('advancedSearch.title')}
      onClick={handleClick}
    >
      <SearchIcon size={18} strokeWidth={1.75} />
    </Button>
  )
}
