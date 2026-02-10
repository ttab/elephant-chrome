import { SearchInput } from '@/components/SearchInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ttab/elephant-ui'
import React, { useState, useRef, type Dispatch, type SetStateAction, type JSX } from 'react'
import type { MediaTypes } from '..'
import { useTranslation } from 'react-i18next'

export const ImageSearchInput = ({ setQueryString, setMediaType }: {
  setQueryString: Dispatch<SetStateAction<string>>
  setMediaType: Dispatch<SetStateAction<MediaTypes>>
}): JSX.Element => {
  const [query, setQuery] = useState('')
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    setQueryString(query)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='self-center w-full p-2 pl-0 gap-1 flex flex-row'
    >
      <SearchInput
        className='p-2 w-full text-sm border-none focus:border-none'
        type='text'
        placeholder={t('views:search.placeholders.search')}
        name='imagesearch'
        ref={inputRef}
        onChange={(e) => setQuery(e.currentTarget.value)}
      />
      <Select onValueChange={(option) => setMediaType(option as MediaTypes)}>
        <SelectTrigger className='w-fit'>
          <SelectValue placeholder={t('views:imageSearch.labels.mediaType')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='image'>{t('views:imageSearch.labels.image')}</SelectItem>
          <SelectItem value='graphic'>{t('views:imageSearch.labels.graphic')}</SelectItem>
        </SelectContent>
      </Select>
    </form>
  )
}
