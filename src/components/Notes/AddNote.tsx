import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks/useYValue'
import { Block } from '@ttab/elephant-api/newsdoc'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ttab/elephant-ui'
import { MessageSquarePlusIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import type * as Y from 'yjs'
import type { JSX } from 'react'

type NoteRole = 'internal' | 'public'

export const AddNote = ({ ydoc, text = '', role }: {
  ydoc: YDocument<Y.Map<unknown>>
  text?: string
  role?: NoteRole
}): JSX.Element => {
  const [notes, setNotes] = useYValue<Block[] | undefined>(ydoc.ele, 'meta.core/note')

  const handleClick = (role: NoteRole) => {
    const newNote = Block.create({
      type: 'core/note',
      data: {
        text: ''
      },
      role
    })

    if (!notes?.length) {
      setNotes([newNote])
    } else
      setNotes([...notes, newNote])
  }

  if (role) {
    return (
      <Button
        variant='ghost'
        onClick={() => handleClick(role)}
      >
        <MessageSquarePlusIcon size={18} strokeWidth={1.75} />
        {text && <span className='text-muted-foreground'>{text}</span>}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn('flex flex-row items-center justify-center gap-1 h-9 p-0 m-0 min-w-9 hover:bg-gray-200 dark:hover:bg-table-focused rounded-md px-1',
          text
            ? 'text-muted-foreground text-xs border rounded-md'
            : '')}
      >
        <MessageSquarePlusIcon size={18} strokeWidth={1.75} className='text-black dark:text-white' />
        {text && <span className='text-muted-foreground'>{text}</span>}
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleClick('internal')}>
          Intern notering
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleClick('public')}>
          Info till kund
        </DropdownMenuItem>
      </DropdownMenuContent>

    </DropdownMenu>
  )
}
