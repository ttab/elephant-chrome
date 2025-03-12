import { Popover, PopoverTrigger, Button, PopoverContent, Command } from '@ttab/elephant-ui'
import { ListFilter } from '@ttab/elephant-ui/icons'
import type { Dispatch, PropsWithChildren, SetStateAction } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { useQuery } from '@/hooks/useQuery'
import type { Updater } from '@tanstack/react-table'

export interface FilterProps {
  page: string
  pages: string[]
  setPages: Dispatch<SetStateAction<string[]>>
  search: string | undefined
  setSearch: Dispatch<SetStateAction<string | undefined>>
  setGlobalTextFilter?: (updater: Updater<unknown>) => void
}

export const Filter = ({ page, pages, setPages, search, setSearch, children, setGlobalTextFilter }:
  PropsWithChildren & FilterProps): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useQuery(['query'])

  const onOpenChange = useMemo(
    () => handleOpenChange({ setOpen, setSearch, setPages }),
    [setOpen, setSearch, setPages])

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [page])

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='xs'
          role='combobox'
          aria-expanded={open}
          className='hidden sm:flex'
        >
          <ListFilter
            size={18}
            strokeWidth={1.75}
            className='@3xl/view:shrink-0 @3xl/view:mr-2'
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0' align='start'>
        <Command
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
            }
            if (e.key === 'ArrowLeft' || (e.key === 'Backspace' && !search)) {
              e.preventDefault()
              setSearch('')
              if (pages.length > 0) {
                setPages(pages.slice(0, -1))
              } else {
                setOpen(false)
              }
            }
          }}
        >

          <DebouncedCommandInput
            ref={inputRef}
            value={page === 'query' ? filter?.query?.[0] : search}
            onChange={(value: string | undefined) => {
              if (value) {
                if (setGlobalTextFilter) {
                  setGlobalTextFilter(value)
                } else {
                  setFilter({ query: [value] })
                }
              }
            }}
            placeholder={page === 'query' ? 'Fritext' : 'Filtrera'}
            className='h-9'
          />
          {children}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function handleOpenChange({ setOpen, setSearch, setPages }: {
  setOpen: Dispatch<SetStateAction<boolean>>
  setSearch: Dispatch<SetStateAction<string | undefined>>
  setPages: Dispatch<SetStateAction<string[]>>
}): (open: boolean) => void {
  return (open: boolean) => {
    setSearch(undefined)
    setPages([''])
    setOpen(open)
  }
}
