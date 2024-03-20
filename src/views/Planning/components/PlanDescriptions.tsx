import { useYObserver } from '@/hooks'
import { MessageCircleMore } from '@ttab/elephant-ui/icons'
import { type Block } from '@/protos/service'
import { TextBox } from '@/components/ui'

export const PlanDescriptions = (): JSX.Element => {
  const { state } = useYObserver('planning', 'meta.core/description')

  const newPublicDescription = isPlaceholderNeeded(state, 'public') &&
    <PlanDescription key='newPublic' role='public' />
  const newInternalMessage = isPlaceholderNeeded(state, 'internal') &&
    <PlanDescription key='newInternal' role='internal' />


  const sortedDescriptions = (Array.isArray(state)
    ? state.map((description: Block, index: number) => {
      return <PlanDescription key={index} index={index} role={description.role} />
    })
    : [])
    .sort((componentA: JSX.Element, componentB: JSX.Element) => {
      const roleOrder = { public: 0, internal: 1 }

      const roleA: keyof typeof roleOrder = componentA.props.role
      const roleB: keyof typeof roleOrder = componentB.props.role

      return roleOrder[roleA] - roleOrder[roleB]
    })

  return (
    <div className='flex flex-col gap-4' >
      {
        ...[
          newPublicDescription,
          ...sortedDescriptions,
          newInternalMessage
        ].filter(x => x)
      }
    </div>
  )
}

function isPlaceholderNeeded(state: Block | Block[] | undefined, role: string): boolean {
  if (Array.isArray(state)) {
    return !state.some((d: Block) => d.role === role)
  } else {
    return true
  }
}


const PlanDescription = ({ role, index }: {
  role: string
  index?: number
}): JSX.Element | undefined => {
  return (
    <div className='flex w-full' >
      <TextBox
        icon={role === 'internal' && <MessageCircleMore
          size={28}
          strokeWidth={1.75}
          className='pr-2 -mt-[0.12rem] text-muted-foreground'
        />}
        placeholder={role === 'public' ? 'Public description' : 'Internal message'}
        yObserver={useYObserver('planning', `meta.core/description[${index}].data`)}
      />
    </div>
  )
}
