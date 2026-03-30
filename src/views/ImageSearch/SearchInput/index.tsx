import { SearchInput } from '@/components/SearchInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ttab/elephant-ui'
import React, { useState, type Dispatch, type SetStateAction, type JSX } from 'react'
import type { MediaTypes } from '..'
import { useTranslation } from 'react-i18next'

export const ImageSearchInput = ({ setQueryString, setMediaType, isNtb }: {
  setQueryString: Dispatch<SetStateAction<string>>
  setMediaType: Dispatch<SetStateAction<MediaTypes>>
  isNtb: boolean
}): JSX.Element => {
  const [query, setQuery] = useState('')
  const { t } = useTranslation()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setQueryString(query)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='flex w-full items-center gap-2'
    >
      <SearchInput
        className='w-full text-sm'
        placeholder={t('views:search.placeholders.search')}
        name='imagesearch'
        onChange={(e) => setQuery(e.currentTarget.value)}
      />
      {!isNtb && (
        <Select onValueChange={(option) => setMediaType(option as MediaTypes)}>
          <SelectTrigger className='w-fit shrink-0'>
            <SelectValue placeholder={t('views:imageSearch.labels.mediaType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='image'>{t('views:imageSearch.labels.image')}</SelectItem>
            <SelectItem value='graphic'>{t('views:imageSearch.labels.graphic')}</SelectItem>
          </SelectContent>
        </Select>
      )}
    </form>
  )
}
