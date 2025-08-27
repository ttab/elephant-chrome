import { useYValue } from '@/hooks/useYValue'
import { Block } from '@ttab/elephant-api/newsdoc'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ttab/elephant-ui'
import { MessageSquarePlus } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

type NoteRole = 'internal' | 'public'

export const AddNote = ({ text = '', role }: {
  text?: string
  role?: NoteRole
}): JSX.Element => {
  const [notes, setNotes] = useYValue<Block[] | undefined>('meta.core/note')

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
        <MessageSquarePlus size={18} strokeWidth={1.75} />
        {text && <span className='text-muted-foreground'>{text}</span>}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn('flex flex-row items-center justify-center gap-1 h-9 p-0 m-0 min-w-9 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-1', text ? 'text-muted-foreground text-xs border rounded-md' : '')}>
        <MessageSquarePlus size={18} strokeWidth={1.75} />
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
