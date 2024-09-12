import { Building, Text } from '@ttab/elephant-ui/icons'
import { TextBox } from '@/components/ui'
import { type Block } from '@/protos/service'
import { useYValue } from '@/hooks/useYValue'


export const Description = ({ role }: {
  role: 'internal' | 'public'
}): JSX.Element => {
  const [stateDescriptions] = useYValue<Block[]>('meta.core/description')

  const index = findIndex(stateDescriptions, role)
  const path = `meta.core/description[${index}].data.text`

  return (
    <div className='flex w-full -ml-1' >
      <TextBox
        path={path}
        icon={role === 'internal'
          ? <Building size={20} strokeWidth={1.75} className='text-muted-foreground' />
          : <Text size={20} strokeWidth={1.75} className='text-muted-foreground' />
        }
        placeholder={role === 'public' ? 'Publik beskrivning' : 'Internt meddelande'}
        className='text-sm'
      />
    </div>
  )
}

function findIndex(stateDescriptions: Block[] | undefined, role: 'internal' | 'public'): number {
  // If no descriptions, assign indices based on role
  if (!stateDescriptions?.length) {
    return role === 'internal' ? 1 : 0
  }

  // Else find index
  const foundIndex = stateDescriptions.findIndex((description) => description.role === role)
  return foundIndex === -1 ? stateDescriptions.length : foundIndex
}
