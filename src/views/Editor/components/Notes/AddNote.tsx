import { useYValue } from '@/hooks/useYValue'
import { Block } from '@ttab/elephant-api/newsdoc'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ttab/elephant-ui'
import { MessageSquarePlusIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

export const AddNote = ({ text = '' }: {
  text?: string
}): JSX.Element => {
  const [notes, setNotes] = useYValue<Block[] | undefined>('meta.core/note')

  const handleClick = (role: string) => {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn('flex flex-row items-center justify-center gap-1 h-9 p-0 m-0 min-w-9 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-1',
          text
            ? 'text-muted-foreground text-xs border rounded-md'
            : '')}
      >
        <MessageSquarePlusIcon size={18} strokeWidth={1.75} />
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
