import { CalendarCommandMenu } from '@/components/CalendarCommandMenu'
import { CommandGroup } from '@ttab/elephant-ui'
import { CalendarCommands } from '../CalendarCommands'
import { useCalendarTable } from '@/hooks/useCalendarTable'
import { type CommandArgs } from '@/contexts/CalendarTableProvider'

export const TableCommandMenu = (): JSX.Element => {
  const { table } = useCalendarTable()

  const handleChange = (value: string | undefined, args: CommandArgs): void => {
    const { setSearch, page } = args
    setSearch(value)
    if (page === 'textFilter') {
      table.setGlobalFilter(value)
    }
  }

  return (
    <CalendarCommandMenu
      onChange={handleChange}
      onKeyDown={(e, setOpen, args) => {
        const { search, setSearch, pages, setPages } = args
        if (e.key === 'Escape') {
          setOpen(false)
          setPages([])
        }
        if (e.key === 'ArrowLeft' || (e.key === 'Backspace' && !search)) {
          e.preventDefault()
          setSearch('')

          if (pages.length > 0) {
            setPages((pages: string[]) => pages.slice(0, -1))
          } else {
            setOpen(false)
          }
        }
      }}
      >
      <CommandGroup heading='Calendar'>
        <CalendarCommands />
      </CommandGroup>
    </CalendarCommandMenu>
  )
}
