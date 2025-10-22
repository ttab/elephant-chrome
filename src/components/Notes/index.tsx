import { cn } from '@ttab/elephant-ui/utils'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { Alert, AlertDescription } from '@ttab/elephant-ui'
import { MessageCircleMoreIcon, Trash2Icon, TextIcon } from '@ttab/elephant-ui/icons'
import { TextBox } from '@/components/ui'
import type { DefaultValueOption } from '@/types/index'
import { useState } from 'react'
import { Prompt } from '@/components/Prompt'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

const Note = ({ ydoc, noteIndex, handleRemove }: {
  ydoc: YDocument<Y.Map<unknown>>
  noteIndex: number
  handleRemove: () => void
}): JSX.Element => {
  const [role, setRole] = useYValue<string>(ydoc.ele, `meta.core/note[${noteIndex}].role`)
  const [value] = useYValue<Y.XmlText>(ydoc.ele, `meta.core/note[${noteIndex}].data.text`, true)
  const [showVerifyRemove, setShowVerifyDialog] = useState(false)
  const [showVerifyChange, setShowVerifyChange] = useState(false)

  const iconProps = {
    strokeWidth: 1.75,
    size: 18
  }


  const roles: DefaultValueOption[] = [
    { value: 'public', label: 'Info till kund', icon: TextIcon, iconProps },
    { value: 'internal', label: 'Intern info', icon: MessageCircleMoreIcon, iconProps }
  ]

  const selectedOptions = roles.filter((r) => r.value === role)
  const SelectedIcon = selectedOptions.length && selectedOptions[0].icon

  console.log('value', typeof value)
  return (
    <Alert className={cn('flex p-1 pl-4', role === 'public'
      ? 'bg-blue-50'
      : 'bg-yellow-50')}
    >
      <div className='flex flex-row w-full justify-between items-center'>
        <AlertDescription className='flex space-x-2 items-center w-full'>
          {selectedOptions?.[0] && SelectedIcon && (
            <div className='flex pr-2'>
              <SelectedIcon {...selectedOptions[0].iconProps} />
            </div>
          )}
          <TextBox
            key={role}
            ydoc={ydoc}
            value={value}
            placeholder={`Lägg till ${role === 'public' ? 'redaktionell' : 'intern'} info`}
            className='font-thin text-sm whitespace-pre-wrap break-words'
            singleLine={true}
          />
        </AlertDescription>
        <div className='hover:cursor-pointer rounded-md p-1 hover:bg-accent2' onClick={() => setShowVerifyDialog(true)}>
          <Trash2Icon size={18} strokeWidth={1.75} />
        </div>
      </div>


      {showVerifyRemove && (
        <Prompt
          title='Ta bort?'
          description='Är du säker på att du vill ta bort info?'
          secondaryLabel='Avbryt'
          primaryLabel='Ta bort'
          onPrimary={() => {
            setShowVerifyDialog(false)
            handleRemove()
          }}
          onSecondary={() => {
            setShowVerifyDialog(false)
          }}
        />
      )}


      {showVerifyChange && (
        <Prompt
          title='Ändra typ?'
          description='Är du säker på att du vill ändra typ av info?'
          secondaryLabel='Avbryt'
          primaryLabel='Ändra typ'
          onPrimary={() => {
            setShowVerifyChange(false)
            setRole(role === 'public' ? 'internal' : 'public')
          }}
          onSecondary={() => {
            setShowVerifyChange(false)
          }}
        />
      )}
    </Alert>
  )
}

export const Notes = ({ ydoc }: {
  ydoc: YDocument<Y.Map<unknown>>
}): JSX.Element | null => {
  const [notes, setNotes] = useYValue<Block[] | undefined>(ydoc.ele, 'meta.core/note')

  if (!notes?.length) {
    return null
  }

  const handleRemove = (index: number) => () => {
    if (notes?.length) {
      setNotes(notes.filter((_, i) => i !== index))
    }
  }

  return Array.isArray(notes) && notes.length > 0
    ? (
        <div className='flex flex-col gap-2 sticky p-4'>
          {notes.map((_, index) => (
            <Note
              ydoc={ydoc}
              key={index}
              noteIndex={index}
              handleRemove={handleRemove(index)}
            />
          ))}
        </div>
      )
    : null
}
