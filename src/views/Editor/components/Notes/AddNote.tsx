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

export const AddNote = (): JSX.Element => {
  const [notes, setNotes] = useYValue<Block[] | undefined>('meta.core/note')

  const handleClick = () => {
    if (!notes?.length) {
      setNotes([newNote])
    } else
      setNotes([...notes, newNote])
  }
  return (
    <Button
      variant='ghost'
      onClick={handleClick}
    >
      <MessageSquarePlus size={18} strokeWidth={1.75} />
    </Button>
  )
}
