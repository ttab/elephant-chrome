import { PlanningCommandMenu } from '@/components/PlanningCommandMenu'
import { CommandGroup } from '@ttab/elephant-ui'
import { PlanningCommands } from '../PlanningCommands'
import { usePlanningTable } from '@/hooks/usePlanningTable'
import { type CommandArgs } from '@/contexts/PlanningTableProvider'

export const TableCommandMenu = (): JSX.Element => {
  const { table } = usePlanningTable()

  const handleChange = (value: string | undefined, args: CommandArgs): void => {
    const { setSearch, page } = args
    setSearch(value)
    if (page === 'textFilter') {
      table.setGlobalFilter(value)
    }
  }

  return (
    <PlanningCommandMenu
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
      <CommandGroup heading='Planning'>
        <PlanningCommands />
      </CommandGroup>
    </PlanningCommandMenu>
  )
}
