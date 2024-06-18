import React, { useState, useRef, type Dispatch, type SetStateAction } from 'react'
import { SearchIcon } from '@ttab/elephant-ui/icons'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, type, ...props }, ref): JSX.Element => {
    return (
      <div className='flex'>
        <input
          type={type}
          className='flex h-10
            w-full
            border-input
            bg-background
            px-3 py-0 ring-offset-background
            placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:0
            disabled:cursor-not-allowed
            disabled:opacity-50'
          ref={ref}
          {...props}
        />
        <div className='absolute inset-y-0 left-1 pl-1 flex items-center pointer-events-none'>
          <SearchIcon strokeWidth='1.75' size='18' />
        </div>

      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'

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
