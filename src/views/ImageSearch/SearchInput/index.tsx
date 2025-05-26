import { SearchInput } from '@/components/SearchInput'
import React, { useState, useRef, type Dispatch, type SetStateAction } from 'react'
import type { MediaTypes } from '..'

export const ImageSearchInput = ({ setQueryString, setMediaType }: {
  setQueryString: Dispatch<SetStateAction<string>>
  setMediaType: Dispatch<SetStateAction<MediaTypes>>
}): JSX.Element => {
  const [query, setQuery] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    setQueryString(query)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='self-center w-full p-2 flex flex-row'
    >
      <SearchInput
        className='p-2 w-full text-sm border-none focus:border-none'
        type='text'
        placeholder='Sök bild'
        name='imagesearch'
        ref={inputRef}
        onChange={(e) => setQuery(e.currentTarget.value)}
      />
    </form>
  )
}
