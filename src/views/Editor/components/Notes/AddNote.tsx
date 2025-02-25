import { useYValue } from '@/hooks/useYValue'
import { Block } from '@ttab/elephant-api/newsdoc'
import { Button } from '@ttab/elephant-ui'
import { MessageSquarePlus } from '@ttab/elephant-ui/icons'

const newNote = Block.create({
  type: 'core/note',
  data: {
    text: ''
  },
  role: 'internal'
})

export const AddNote = ({ text = '', variant = 'ghost' }: {
  text?: string
  variant?: string
}): JSX.Element => {
  const [notes, setNotes] = useYValue<Block[] | undefined>('meta.core/note')

  const handleClick = () => {
    if (!notes?.length) {
      setNotes([newNote])
    } else
      setNotes([...notes, newNote])
  }

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      className='flex flex-row gap-1 text-xs'
    >
      <MessageSquarePlus size={18} strokeWidth={1.75} />
      {text && <span className='text-muted-foreground'>{text}</span>}
    </Button>
  )
}
