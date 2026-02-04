import { useTable } from '@/hooks'
import { CommandItem } from '@ttab/elephant-ui'
import { SearchIcon } from '@ttab/elephant-ui/icons'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

export const TextFilter = (): JSX.Element | null => {
  const { command, table } = useTable()
  const { setPages, setSearch, pages, page } = command
  const { t } = useTranslation()

  const globalFilter: unknown = table.getState().globalFilter
  return !page
    ? (
        <CommandItem
          className='flex gap-1 items-center'
          onSelect={() => {
            setPages([...pages, 'query'])
            if (typeof globalFilter === 'string') {
              setSearch(globalFilter)
            }
          }}
        >
          <SearchIcon size={18} strokeWidth={1.75} className='mr-2' />
          {t('shared:toolbar.freeText')}
        </CommandItem>
      )
    : null
}
