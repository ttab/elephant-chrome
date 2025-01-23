import { Popover, PopoverTrigger, Button, PopoverContent, Command } from '@ttab/elephant-ui'
import { ListFilter } from '@ttab/elephant-ui/icons'
import type { Dispatch, SetStateAction } from 'react'
import { useMemo, useState } from 'react'
import { StatusFilter } from './Items/StatusFilter'
import { SectionFilter } from './Items/SectionFilter'

export const GridFilter = (): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState<string>('')

  const onOpenChange = useMemo(
    () => handleOpenChange({ setOpen }),
    [setOpen])

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
      <PopoverContent className='w-[200px] p-0' align='start' onEscapeKeyDown={() => setPage('')}>
        <Command>
          <StatusFilter page={page} setPage={setPage} />
          <SectionFilter page={page} setPage={setPage} />
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function handleOpenChange({ setOpen }: { setOpen: Dispatch<SetStateAction<boolean>> }): (open: boolean) => void {
  return (open: boolean) => setOpen(open)
}
