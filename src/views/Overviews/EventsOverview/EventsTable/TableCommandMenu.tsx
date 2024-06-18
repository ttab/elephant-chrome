import { EventsCommandMenu } from '@/components/CommandMenu/EventsCommandMenu'
import { CommandGroup } from '@ttab/elephant-ui'
import { EventsCommands } from '../EventsCommands'
import { useEventsTable } from '@/hooks/useEventsTable'
import { type CommandArgs } from '@/contexts/EventsTableProvider'

export const TableCommandMenu = (): JSX.Element => {
  const { table } = useEventsTable()

  const handleChange = (value: string | undefined, args: CommandArgs): void => {
    const { setSearch, page } = args
    setSearch(value)
    if (page === 'textFilter') {
      table.setGlobalFilter(value)
    }
  }

  return (
    <EventsCommandMenu
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
      <CommandGroup heading='Events'>
        <EventsCommands />
      </CommandGroup>
    </EventsCommandMenu>
  )
}
