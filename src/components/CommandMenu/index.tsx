import { useEffect, useState, useCallback } from 'react'
import {
  GanttChart
} from '@ttab/elephant-ui/icons'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@ttab/elephant-ui'

import { handleLink } from '../Link/lib/handleLink'
import { useNavigation } from '@/hooks'
import { v4 as uuid } from 'uuid'

export function CommandMenu(): JSX.Element {
  const { state, dispatch } = useNavigation()

  const [open, setOpen] = useState(false)

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
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
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
          <CommandSeparator />
        </CommandList>
      </CommandDialog>
    </>
  )
}
