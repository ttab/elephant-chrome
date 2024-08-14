import { CommandMenu } from '@/components/Commands/Menu'
import { CommandGroup } from '@ttab/elephant-ui'
import { useTable } from '@/hooks'
import { type CommandArgs } from '@/contexts/TableProvider'
import { type PropsWithChildren } from 'react'

export const TableCommandMenu = ({ children }: PropsWithChildren): JSX.Element => {
  const { table } = useTable()

  const handleChange = (value: string | undefined, args: CommandArgs): void => {
    const { setSearch, page } = args
    setSearch(value)
    if (page === 'textFilter') {
      table.setGlobalFilter(value)
    }
  }

  return (
    <CommandMenu
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
        {children}
      </CommandGroup>
    </CommandMenu>
  )
}
