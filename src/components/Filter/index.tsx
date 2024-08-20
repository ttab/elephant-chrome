import { type Dispatch, useState, useMemo, type PropsWithChildren, useRef, useEffect } from 'react'
import { ListFilter } from '@ttab/elephant-ui/icons'
import {
  Button,
  Command,
  Popover, PopoverContent, PopoverTrigger
} from '@ttab/elephant-ui'

import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { useTable } from '@/hooks'

export const Filter = ({ children }: PropsWithChildren): JSX.Element => {
  const [open, setOpen] = useState(false)

  const { command, table } = useTable()
  const { setSearch, setPages, search, pages, page } = command

  const onOpenChange = useMemo(
    () => handleOpenChange({ setOpen, setSearch, setPages }),
    [setOpen, setSearch, setPages])

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (page === 'textFilter' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [page])

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="hidden sm:flex"
        >
          <ListFilter size={18} strokeWidth={1.75} className="shrink-0 mr-2" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align='start'>
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
            placeholder={page === 'textFilter' ? 'Sök' : 'Filter'}
            className="h-9"
          />
          {children}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function handleOpenChange({ setOpen, setSearch, setPages }: {
  setOpen: Dispatch<boolean>
  setSearch: Dispatch<string | undefined>
  setPages: Dispatch<string[]>
}): (open: boolean) => void {
  return (open: boolean) => {
    setSearch(undefined)
    setPages([])
    setOpen(open)
  }
}
