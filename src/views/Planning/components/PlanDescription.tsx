import { useEffect, useRef } from 'react'
import { useYMap } from '@/hooks'
import { type CollabComponentProps } from '@/types'
import { Textarea } from '@ttab/elephant-ui'
import { Awareness } from '@/components'
import { type YMap } from 'node_modules/yjs/dist/src/internals'

export const PlanDescription = ({ isSynced, document }: CollabComponentProps): JSX.Element => {
  const [description, setDescription, initDescription] = useYMap('core/description/text')

  const setFocused = useRef<(value: boolean) => void>(null)

  useEffect(() => {
    if (!isSynced || !document) {
      return
    }

    const planningYMap: YMap<unknown> = document.getMap('planning')
    initDescription(planningYMap)
  }, [
    isSynced,
    document,
    initDescription
  ])

  return isSynced && document
    ? (
      <Awareness name='PlanDescription' ref={setFocused}>
        <Textarea
          value={description as string}
          onChange={(event) => setDescription(event.target.value)}
          onFocus={(event) => {
            if (setFocused.current) {
              console.log(event)
              setFocused.current(true)
            }
          }}
          onBlur={(event) => {
            if (setFocused.current) {
              console.log(event)
              setFocused.current(false)
            }
          }}
          className='h-screen'
        />
      </Awareness>
      )
    : <p>Loading</p>
}
