import { useYValue } from '@/hooks/useYValue'
import { cn } from '@ttab/elephant-ui/utils'
import { type Block } from '@ttab/elephant-api/newsdoc'

import { Alert, AlertDescription } from '@ttab/elephant-ui'
import { MessageCircleMore, Text } from '@ttab/elephant-ui/icons'

const Note = ({ note }: { note: Block }): JSX.Element => {
  return (
    <Alert className={cn('flex', note.role === 'public'
      ? 'bg-blue-50'
      : 'bg-yellow-50')}
    >
      <AlertDescription className='flex space-x-2 items-center'>
        {note.role === 'public'
          ? <Text strokeWidth={1.75} size={18} />
          : <MessageCircleMore strokeWidth={1.75} size={18} />}
        <pre className='font-thin text-sm whitespace-pre-wrap break-words'>{note.data.text}</pre>
      </AlertDescription>
    </Alert>
  )
}

export const Notes = (): JSX.Element[] | null => {
  const [notes] = useYValue<Block[] | undefined>('meta.core/note')

  return Array.isArray(notes) && notes.length > 0
    ? notes.map((note, index) => (
      <Note key={index} note={note} />))
    : null
}
