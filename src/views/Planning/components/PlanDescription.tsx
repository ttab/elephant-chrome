import { useYMap } from '@/hooks'
import { type PlanningComponentProps } from '@/types'
import { type YMap } from 'node_modules/yjs/dist/src/internals'
import { useEffect } from 'react'
import { Textarea } from '@ttab/elephant-ui'

export const PlanDescription = ({ isSynced, document }: PlanningComponentProps): JSX.Element => {
  const [description, setDescription, initDescription] = useYMap('core/description/text')


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
      <Textarea
        value={description as string}
        onChange={(event) => setDescription(event.target.value)}
        className='h-screen'
      />
      )
    : <p>Loading</p>
}
