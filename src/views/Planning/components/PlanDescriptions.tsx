import { useRef } from 'react'
import type * as Y from 'yjs'
import { useYObserver } from '@/hooks'
import { Button, Textarea } from '@ttab/elephant-ui'
import { Awareness } from '@/components'
import { type Block } from '@/protos/service'

const PlanDescription = ({ yDescription }: { yDescription: Y.Map<unknown> }): JSX.Element => {
  const [description, setDescription] = useYObserver<string>(yDescription, 'data.text')
  const setFocused = useRef<(value: boolean) => void>(null)
  return (
    <Awareness name='PlanDescription' ref={setFocused}>
      <Textarea
        value={description}
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
    </Awareness>
  )
}
export const PlanDescriptions = ({ yArray }: { yArray?: Y.Array<unknown> }): JSX.Element => {
  const [descriptions, setDescriptions] = useYObserver<Block>(yArray)

  return descriptions && (
    <div>
      <Button
        variant='outline'
        onClick={() => {
          setDescriptions({
            id: '',
            uuid: '',
            uri: '',
            url: '',
            type: 'core/description',
            title: '',
            data: {
              text: ''
            },
            rel: '',
            role: 'internal',
            name: '',
            value: '',
            contentType: '',
            links: [],
            content: [],
            meta: []
          })
        }}
        >
        Add description
      </Button>
      {descriptions.map((_, index: number) => {
        return <PlanDescription key={index} yDescription={yArray?.get(index) as Y.Map<unknown>} />
      })}
    </div>
  )
}
