import React, {
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  useMemo,
  type SetStateAction
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
import { DebouncedCommandInput } from './DebouncedCommandInput'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useNavigation, useTable, useView } from '@/hooks'
import { type CommandArgs } from '@/contexts/TableProvider'

interface CommandMenuProps {
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>, setOpen: Dispatch<boolean>, args: CommandArgs) => void
  onChange: (value: string | undefined, args: CommandArgs) => void
  children?: JSX.Element
}

export const CommandMenu = ({ children, onKeyDown, onChange }: CommandMenuProps): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const [open, setOpen] = useState(false)

  const { viewId } = useView()

  const { command } = useTable()
  const { search, setSearch, pages, setPages, page } = command

  const onOpenChange = useMemo(
    () => handleOpenChange({ setOpen, setSearch, setPages }),
    [setOpen, setSearch, setPages])

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          onKeyDown={(e) => onKeyDown(e, setOpen, command)}
        >
          <DebouncedCommandInput
            value={search}
            onChange={(value) => onChange(value, command)}
            placeholder={getPlaceholder(pages, page)}
            className="h-9"
          />
          {children}
          {!page && (
            <CommandGroup heading="Suggestions">
              <CommandItem
                onSelect={() => runCommand(() => handleLink({
                  dispatch,
                  viewItem: state.viewRegistry.get('Plannings'),
                  viewId: crypto.randomUUID(),
                  viewRegistry: state.viewRegistry,
                  origin: viewId
                }))}
              >
                <GanttChart size={18} strokeWidth={1.75} className="mr-2" />
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

function getPlaceholder(pages: string[], page: string): string {
  if (pages.length === 0) return 'Type a command or search'

  if (page === 'textFilter') return 'Filter by text'

  return 'Filter'
}

function handleOpenChange({ setOpen, setSearch, setPages }: {
  setOpen: Dispatch<boolean>
  setSearch: Dispatch<SetStateAction<string | undefined>>
  setPages: Dispatch<string[]>
}): (open: boolean) => void {
  return (open: boolean) => {
    setSearch(undefined)
    setPages([])
    setOpen(open)
  }
}
