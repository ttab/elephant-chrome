import { SearchInput } from '@/components/SearchInput'
import React, { useState, useRef, type Dispatch, type SetStateAction } from 'react'

export const ImageSearchInput = ({ setQueryString }: {
  setQueryString: Dispatch<SetStateAction<string>>
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
      className="self-center w-full p-2 flex flex-row"
    >
      <SearchInput
        className="p-2 w-full text-sm border-none focus:border-none"
        type="text"
        placeholder='Sök bild'
        name="imagesearch"
        ref={inputRef}
        onChange={(e) => setQuery(e.currentTarget.value)}
      />
    </form>
  )
}
