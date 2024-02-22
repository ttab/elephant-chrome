import { useRef } from 'react'
import type * as Y from 'yjs'
import { useYObserver } from '@/hooks'
import { Textarea } from '@ttab/elephant-ui'
import { Awareness } from '@/components'
import { type Block } from '@/protos/service'
import { MessageCircleMore } from '@ttab/elephant-ui/icons'
import { get } from '@/lib/yMapValueByPath'

const PlanDescription = ({ yDescription }: { yDescription?: Y.Map<unknown> }): JSX.Element => {
  const [description, setDescription] = useYObserver<string>(yDescription, 'data.text')
  const setFocused = useRef<(value: boolean) => void>(null)
  // const placeholder = escription.role === 'public' ? 'Add public description' : 'Add internal message'
  return (
    <Awareness name='PlanMessage' ref={setFocused}>
      <div className='flex'>
        <Textarea
          className='border-0 p-0 font-normal text-base '
          value={description}
          placeholder='description'
          onChange={(event) => setDescription(event.target.value)}
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

export const PlanDescriptions = ({ yArray }: { yArray?: Y.Array<unknown> }): JSX.Element => {
  const [descriptions = []] = useYObserver<Block>(yArray)

  /* const newPublicDescription = !descriptions.some(d => d.role === 'public') && <PlanDescription key='newPublic' role='public' />
  const newInternalMessage = !descriptions.some(d => d.role === 'internal') && <PlanDescription key='newInternal 'role='internal' /> */

  const sortedDescriptions = descriptions.map((d, index: number) => {
    return <PlanDescription key={index} yDescription={get(yArray, `[${index}]`) as Y.Map<unknown>} />
  })
    .sort((componentA, componentB) => {
      const roleOrder = { public: 0, internal: 1 }

      const roleA: keyof typeof roleOrder = componentA.props.role
      const roleB: keyof typeof roleOrder = componentB.props.role

      return roleOrder[roleA] - roleOrder[roleB]
    })

  return (
    <div className='flex flex-col gap-4'>
      {...[
        ...sortedDescriptions
      ].filter(x => x)}
    </div>
  )
}
