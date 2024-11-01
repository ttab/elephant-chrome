import React from 'react'
import { SearchIcon } from '@ttab/elephant-ui/icons'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
  type?: string
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, type = 'text', ...props }, ref): JSX.Element => {
    return (
      <div className='flex gap-1'>
        <div className='pl-1 flex items-center pointer-events-none'>
          <SearchIcon strokeWidth='1.75' size='18' />
        </div>
        <input
          type={type}
          className='flex h-10
            w-full
            border
            border-input
            rounded
            border-solid
            border-slate-200
            bg-background
            py-0
            ring-offset-background
            placeholder: pl-2
            placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:0
            disabled:cursor-not-allowed
            disabled:opacity-50'
          ref={ref}
          {...props}
        />

      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
