import React, {
  type Dispatch,
  useEffect,
  useState,
  useCallback
} from 'react'
import {
  GanttChart
} from '@ttab/elephant-ui/icons'

import {
  Dialog,
  DialogContent,
  Command,
  CommandGroup,
  CommandItem,
  CommandSeparator
} from '@ttab/elephant-ui'
import { DebouncedCommandInput } from '@/views/PlanningOverview/PlanningCommands/DebouncedCommandInput'
import { handleLink } from '../Link/lib/handleLink'
import { useNavigation } from '@/hooks'
import { v4 as uuid } from 'uuid'

export interface CmdProps {
  pages: string[]
  setPages: Dispatch<string[] | ((p: string[]) => string[])>
  page: string
  search: string | undefined
  setSearch: Dispatch<string | undefined>
  open: boolean
  setOpen: Dispatch<boolean>
}

interface CommandMenuProps {
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, args: CmdProps) => void
  onChange: (value: string | undefined, args: CmdProps) => void
  render: (props: CmdProps) => JSX.Element
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ render, onKeyDown, onChange }) => {
  const { state, dispatch } = useNavigation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState<string | undefined>('')
  const [pages, setPages] = useState<string[]>([])
  const page = pages[pages.length - 1]

  const cmdProps: CmdProps = {
    pages,
    setPages,
    page,
    search,
    setSearch,
    open,
    setOpen
  }

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          onKeyDown={(e) => onKeyDown(e, cmdProps)}
        >
          <DebouncedCommandInput
            value={search}
            onChange={(value) => onChange(value, cmdProps)}
            placeholder={pages.length === 0 ? 'Type a command or search...' : 'Filter by text'}
            className="h-9"
      />
          {render(cmdProps)}
          {!page && (
          <CommandGroup heading="Suggestions">
            <CommandItem
              onSelect={() => runCommand(() => handleLink({
                dispatch,
                viewItem: state.viewRegistry.get('PlanningOverview'),
                id: uuid(),
                viewRegistry: state.viewRegistry
              }))}
            >
              <GanttChart className="mr-2 h-4 w-4" />
              <span>Planning overview</span>
            </CommandItem>
          </CommandGroup>
          )}
          <CommandSeparator />
        </Command>
      </DialogContent>
    </Dialog>
  )
}
