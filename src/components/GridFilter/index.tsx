import { Popover, PopoverTrigger, Button, PopoverContent, Command } from '@ttab/elephant-ui'
import { ListFilter } from '@ttab/elephant-ui/icons'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DebouncedCommandInput } from '../Commands/Menu/DebouncedCommandInput'
import { GridCommands } from './Commands'

export const GridFilter = (): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState<string>('')
  const [search, setSearch] = useState<string | undefined>('')

  const onOpenChange = useMemo(
    () => handleOpenChange({ setOpen, setSearch, setPage }),
    [setOpen, setSearch, setPage])

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
              if (page) {
                setPage('')
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
            }}
            placeholder={page === 'textFilter' ? 'Sök' : 'Filtrera'}
            className='h-9'
          />
          <GridCommands page={page} setPage={setPage} setSearch={setSearch} />
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function handleOpenChange({ setOpen, setSearch, setPage }: {
  setOpen: Dispatch<SetStateAction<boolean>>
  setSearch: Dispatch<SetStateAction<string | undefined>>
  setPage: Dispatch<SetStateAction<string>>
}): (open: boolean) => void {
  return (open: boolean) => {
    setSearch(undefined)
    setPage('')
    setOpen(open)
  }
}
