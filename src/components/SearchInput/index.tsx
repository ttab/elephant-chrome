import React from 'react'
import { SearchIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> { withIcon?: boolean }

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, type, withIcon = true, ...props }, ref): JSX.Element => {
    return (
      <div className='flex gap-1'>
        <div className='pl-1 flex items-center pointer-events-none'>
          {withIcon ? <SearchIcon strokeWidth='1.75' size='18' /> : null}
        </div>
        <input
          type={type}
          className={cn(`flex h-10
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
            disabled:opacity-50`, className)}
          ref={ref}
          {...props}
        />

      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
