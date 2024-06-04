import { Building } from '@ttab/elephant-ui/icons'
import { TextBox } from '@/components/ui'
import { useYObserver } from '@/hooks'
import { type Block } from '@/protos/service'

function findIndex(stateDescriptions: Block[], role: 'internal' | 'public'): number {
  // If no descriptions, assign indices based on role
  if (!stateDescriptions?.length) {
    return role === 'internal' ? 1 : 0
  }

  // Else find index
  const foundIndex = stateDescriptions.findIndex((description) => description.role === role)
  return foundIndex === -1 ? stateDescriptions.length : foundIndex
}

export const PlanDescription = ({ role }: {
  role: 'internal' | 'public'
}): JSX.Element => {
  const { state: stateDescriptions = [] } = useYObserver('meta', 'core/description')

  const index = findIndex(stateDescriptions, role)

  const path = `core/description[${index === -1 ? stateDescriptions.length : index}].data`

  return (
    <div className='flex w-full -ml-1' >
      <TextBox
        base='meta'
        path={path}
        field='text'
        icon={role === 'internal' && <Building
          size={26}
          strokeWidth={1.75}
          className='p-0 text-muted-foreground'
        />}
        placeholder={role === 'public' ? 'Publik beskrivning' : 'Internt meddelande'}
      />
    </div>
  )
}
