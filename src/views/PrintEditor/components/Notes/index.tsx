import { useYValue } from '@/hooks/useYValue'
import { cn } from '@ttab/elephant-ui/utils'
import type { Block } from '@ttab/elephant-api/newsdoc'

import {
  Alert,
  AlertDescription,
  Button,
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger
} from '@ttab/elephant-ui'
import { MessageCircleMore, X } from '@ttab/elephant-ui/icons'
import { TextBox } from '@/components/ui'
import type { DefaultValueOption } from '@/types/index'
import { useState } from 'react'
import { Prompt } from '@/components/Prompt'

const Note = ({ noteIndex, handleRemove }: {
  noteIndex: number
  handleRemove: () => void
}): JSX.Element => {
  const [role, setRole] = useYValue<string>(`meta.core/note[${noteIndex}].role`)
  const [showVerifyRemove, setShowVerifyDialog] = useState(false)
  const [showVerifyChange, setShowVerifyChange] = useState(false)

  const iconProps = {
    strokeWidth: 1.75,
    size: 18
  }


  const roles: DefaultValueOption[] = [
    { value: 'internal', label: 'Intern info', icon: MessageCircleMore, iconProps }
  ]

  const selectedOptions = roles.filter((r) => r.value === role)
  const SelectedIcon = selectedOptions.length && selectedOptions[0].icon

  return (
    <Alert className={cn('flex p-1 pl-4', role === 'public'
      ? 'bg-blue-50'
      : 'bg-yellow-50')}
    >
      <div className='flex flex-row w-full justify-between'>
        <AlertDescription className='flex space-x-2 items-center w-full'>
          <Select
            value={selectedOptions?.[0]?.value}
            onValueChange={() => {
              setShowVerifyChange(true)
            }}
          >
            <SelectTrigger
              className={cn({
                'bg-blue-50': role === 'public',
                'bg-yellow-50': role === 'internal'
              }, 'w-fit border-0')}
            >
              {selectedOptions?.[0] && SelectedIcon && (
                <div className='flex pr-2'>
                  <SelectedIcon {...selectedOptions[0].iconProps} />
                </div>
              )}
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem value={role.value} key={role.value}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TextBox
            key={role}
            path={`meta.core/note[${noteIndex}].data.text`}
            placeholder={`Lägg till ${role === 'public' ? 'redaktionell' : 'intern'} notering`}
            className='font-thin text-sm whitespace-pre-wrap break-words'
            singleLine={true}
          />
        </AlertDescription>
        <div>
          <Button
            variant='icon'
            onClick={() => { setShowVerifyDialog(true) }}
          >
            <X strokeWidth={1.75} size={18} className='ml-auto' />
          </Button>
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

export const Notes = (): JSX.Element | null => {
  const [notes, setNotes] = useYValue<Block[] | undefined>('meta.core/note')

  const handleRemove = (index: number) => () => {
    if (notes?.length) {
      setNotes(notes.filter((_, i) => i !== index))
    }
  }

  return Array.isArray(notes) && notes.length > 0
    ? (
        <div className='flex flex-col gap-2 sticky'>
          {notes.map((_, index) => (
            <Note
              key={index}
              noteIndex={index}
              handleRemove={handleRemove(index)}
            />
          ))}
        </div>
      )
    : null
}
