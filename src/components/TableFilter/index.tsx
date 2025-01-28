import type { SetStateAction } from 'react'
import { type Dispatch, useState, useMemo, useRef, useEffect } from 'react'
import { ListFilter } from '@ttab/elephant-ui/icons'
import {
  Button,
  Command,
  Popover, PopoverContent, PopoverTrigger
} from '@ttab/elephant-ui'

import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { useTable } from '@/hooks'
import { Commands } from '../Commands'

export const TableFilter = (): JSX.Element => {
  const [open, setOpen] = useState(false)

  const { command, table } = useTable()
  const { setSearch, setPages, search, pages, page } = command

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
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='hidden sm:flex'
        >
          <ListFilter
            size={18}
            strokeWidth={1.75}
            className='@3xl/view:shrink-0 @3xl/view:mr-2'
          />
          <span className='hidden @3xl/view:inline'>Filter</span>
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
            value={search}
            onChange={(value: string | undefined) => {
              setSearch(value)
              if (page === 'textFilter') {
                table.setGlobalFilter(value)
              }
            }}
            placeholder={page === 'textFilter' ? 'Sök' : 'Filtrera'}
            className='h-9'
          />
          <Commands />
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
    setPages([])
    setOpen(open)
  }
}
