import React from 'react'
import { MessageCircleMore, Text } from '@ttab/elephant-ui/icons'
import { TextBox } from '@/components/ui'
import { type Block } from '@ttab/elephant-api/newsdoc'
import { useYValue } from '@/hooks/useYValue'
import type { FormProps } from './Form/Root'

export const Description = React.memo(function Description({ role, onChange }: {
  role: 'internal' | 'public'
} & FormProps): JSX.Element | null {
  // FIXME: The use of statuDescriptions is causing rerenders on _every_ change
  const [stateDescriptions] = useYValue<Block[]>('meta.core/description')

  const index = findIndex(stateDescriptions, role)
  const path = `meta.core/description[${index}].data.text`

  return (
    <div className='flex w-full'>
      <TextBox
        path={path}
        onChange={onChange}
        icon={role === 'internal'
          ? <MessageCircleMore size={18} strokeWidth={1.75} className='text-muted-foreground mr-4' />
          : <Text size={18} strokeWidth={1.75} className='text-muted-foreground mr-4' />}
        placeholder={role === 'public' ? 'Publik beskrivning' : 'Internt meddelande'}
        className='text-sm'
      />
    </div>
  )
})

function findIndex(stateDescriptions: Block[] | undefined, role: 'internal' | 'public'): number {
  // If no descriptions, assign indices based on role
  if (!stateDescriptions?.length) {
    return role === 'internal' ? 1 : 0
  }

  // Else find index
  const foundIndex = stateDescriptions.findIndex((description) => description.role === role)
  return foundIndex === -1 ? stateDescriptions.length : foundIndex
}

