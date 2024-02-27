import { useRef } from 'react'
import { useYObserver } from '@/hooks'
import { Textarea } from '@ttab/elephant-ui'
import { Awareness } from '@/components'
import { MessageCircleMore } from '@ttab/elephant-ui/icons'
import { type Block } from '@/protos/service'

const PlanDescription = ({ role, index }: { role: string, index?: number }): JSX.Element => {
  const { get, set } = useYObserver('planning', `meta.core/description[${index}].data`)

  const setFocused = useRef<(value: boolean) => void>(null)
  const placeholder = role === 'public' ? 'Add public description' : 'Add internal message'
  return (
    <Awareness name='PlanMessage' ref={setFocused}>
      <div className='flex'>
        {role === 'internal' && <MessageCircleMore className='size-6 pr-2'/>}
        <Textarea
          className='border-0 p-0 font-normal text-base '
          value={get('text') as string}
          placeholder={placeholder}
          onChange={(event) => set(event.target.value, 'text')}
          onFocus={() => {
            if (setFocused.current) {
              setFocused.current(true)
            }
          }}
          onBlur={() => {
            if (setFocused.current) {
              setFocused.current(false)
            }
          }}
        />
      </div>
    </Awareness>
  )
}

export const PlanDescriptions = (): JSX.Element => {
  const { state } = useYObserver('planning', 'meta.core/description')

  const newPublicDescription = isPlaceholderNeeded(state, 'public') &&
    <PlanDescription key='newPublic' role='public' />
  const newInternalMessage = isPlaceholderNeeded(state, 'internal') &&
    <PlanDescription key='newInternal 'role='internal' />


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
    <div className='flex flex-col gap-4'>
      {...[
        newPublicDescription,
        ...sortedDescriptions,
        newInternalMessage
      ].filter(x => x)}
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
