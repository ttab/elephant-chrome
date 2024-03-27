import { useYObserver } from '@/hooks'
import { MessageCircleMore } from '@ttab/elephant-ui/icons'
import { type Block } from '@/protos/service'
import { TextBox } from '@/components/ui'

export const PlanDescriptions = (): JSX.Element => {
  const { state, loading } = useYObserver('planning', 'meta.core/description')

  return !loading
    ? <div className='flex flex-col gap-4'>
      {['public', 'internal'].map((role, index) => (
        <PlanDescription key={role} role={role} index={findRoleIndex(role, index, state as Block[])} />
      ))}
    </div>
    : <p>Loading...</p>
}

// Find the index of the role in the state array
// If the role is not found, return the length of the state array or the index of the role
function findRoleIndex(role: string, index: number, state: Block[]): number {
  const roleIndex = (state || []).findIndex((block) => block?.role === role)
  return roleIndex === -1
    ? state?.length || index
    : roleIndex
}


const PlanDescription = ({ role, index }: {
  role: string
  index: number
}): JSX.Element | undefined => {
  return (
    <div className='flex w-full' >
      <TextBox
        role={role}
        icon={role === 'internal' && <MessageCircleMore
          size={28}
          strokeWidth={1.75}
          className='pr-2 -mt-[0.12rem] text-muted-foreground'
        />}
        placeholder={role === 'public' ? 'Public description' : 'Internal message'}
        yObserver={useYObserver('planning', `meta.core/description[${index}]`)}
      />
    </div>
  )
}
