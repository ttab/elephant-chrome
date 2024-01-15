import { type Dispatch, useState, useMemo } from 'react'
import { ChevronDown } from '@ttab/elephant-ui/icons'
import {
  Button,
  Command,
  Popover, PopoverContent, PopoverTrigger
} from '@ttab/elephant-ui'

import { PlanningCommands } from '../PlanningCommands'
import { DebouncedCommandInput } from '@/components/CommandMenu/DebouncedCommandInput'
import { useTable } from '@/hooks'

export function Filter(): JSX.Element {
  const [open, setOpen] = useState(false)

  const { command, table } = useTable()
  const { setSearch, setPages, search, pages, page } = command

  const onOpenChange = useMemo(
    () => handleOpenChange({ setOpen, setSearch, setPages }),
    [setOpen, setSearch, setPages])

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          Filter...
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
            }
            if (e.key === 'ArrowLeft' || (e.key === 'Backspace' && !search)) {
              e.preventDefault()
              setSearch('')
              if (pages.length > 0) {
                setPages((pages) => pages.slice(0, -1))
              } else {
                setOpen(false)
              }
            }
          }}
        >

          <DebouncedCommandInput
            value={search}
            onChange={(value: string | undefined) => {
              setSearch(value)
              if (page === 'textFilter') {
                table.setGlobalFilter(value)
              }
            }}
            placeholder="Filter..."
            className="h-9"
      />
          <PlanningCommands />
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
