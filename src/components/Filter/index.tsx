import { Popover, PopoverTrigger, Button, PopoverContent, Command } from '@ttab/elephant-ui'
import { ListFilterIcon } from '@ttab/elephant-ui/icons'
import type { Dispatch, PropsWithChildren, SetStateAction, JSX } from 'react'
import { useMemo, useState } from 'react'
import type { Updater } from '@tanstack/react-table'
import { useQuery } from '@/hooks/useQuery'

export interface FilterProps {
  page: string
  pages: string[]
  setPages: Dispatch<SetStateAction<string[]>>
  search: string | undefined
  setSearch: Dispatch<SetStateAction<string | undefined>>
  setGlobalTextFilter?: (updater: Updater<unknown>) => void
}

export const Filter = ({ pages, setPages, setSearch, children, search }:
  PropsWithChildren & FilterProps): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [filter] = useQuery(['query'])

  const onOpenChange = useMemo(
    () => handleOpenChange({ setOpen, setSearch, setPages }),
    [setOpen, setSearch, setPages])

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='xs'
          role='combobox'
          aria-expanded={open}
          className='h-9 w-9'
        >
          <ListFilterIcon
            size={18}
            strokeWidth={1.75}
            className='@3xl/view:shrink-0'
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0' align='start'>
        <Command
          shouldFilter={pages.length > 1 ? true : false}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
            }

            if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
              if (pages.length > 0 && ((filter?.query?.[0]) || search)) {
                e.stopPropagation()
                return
              }

              if (pages.length > 1) {
                e.preventDefault()
                setSearch('')
                setPages(pages.slice(0, -1))
              } else {
                setOpen(false)
              }
            }
          }}
        >
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
    setSearch('')
    setPages([''])
    setOpen(open)
  }
}
