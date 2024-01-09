import { CommandMenu, type CmdProps } from '@/components/CommandMenu'
import { CommandGroup } from '@ttab/elephant-ui'
import { PlanningCommands } from '../PlanningCommands'
import { useTable } from '@/hooks/useTable'

export const TableCommandMenu = (): JSX.Element => {
  const { table } = useTable()

  const handleChange = (value: string | undefined, args: CmdProps): void => {
    const { setSearch, page } = args
    setSearch(value)
    if (page === 'textFilter') {
      table.setGlobalFilter(value)
    }
  }

  return (
    <CommandMenu
      onChange={handleChange}
      onKeyDown={(e, args) => {
        const { search, setSearch, pages, setPages, setOpen } = args
        if (e.key === 'Escape' || e.key === 'ArrowLeft' || (e.key === 'Backspace' && !search)) {
          e.preventDefault()
          setSearch('')

          if (pages.length > 0) {
            setPages((pages: string[]) => pages.slice(0, -1))
          } else {
            setOpen(false)
          }
        }
      }}
        render={(props: CmdProps) => (
          <CommandGroup heading='Planning'>
            <PlanningCommands {...props} />
          </CommandGroup>
        )}
      />

  )
}
