import { SearchInput } from '@/components/SearchInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ttab/elephant-ui'
import React, { useState, type Dispatch, type SetStateAction, type JSX } from 'react'
import type { MediaTypes } from '..'

export const ImageSearchInput = ({ setQueryString, setMediaType, isNtb }: {
  setQueryString: Dispatch<SetStateAction<string>>
  setMediaType: Dispatch<SetStateAction<MediaTypes>>
  isNtb: boolean
}): JSX.Element => {
  const [query, setQuery] = useState('')

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
        placeholder='Sök bilder'
        name='imagesearch'
        onChange={(e) => setQuery(e.currentTarget.value)}
      />
      {!isNtb && (
        <Select onValueChange={(option) => setMediaType(option as MediaTypes)}>
          <SelectTrigger className='w-fit shrink-0'>
            <SelectValue placeholder='Bild' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='image'>Bild</SelectItem>
            <SelectItem value='graphic'>Grafik</SelectItem>
          </SelectContent>
        </Select>
      )}
    </form>
  )
}
