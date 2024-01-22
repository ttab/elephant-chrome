import { Priorities } from '@/defaults'
import { useYMap } from '@/hooks'
import { NewsValueScoreDropDown } from '@/views/Editor/EditorHeader/NewsValueScoreDropDown'
import { useEffect } from 'react'
import { PlanTitle } from '../components/PlanTitle'
import { type CollabComponentProps } from '@/types'

export const PlanningHeader = ({ isSynced, document }: CollabComponentProps): JSX.Element => {
  const [priority, setPriority, initPriority] = useYMap('core/planning-item/priority')

  useEffect(() => {
    if (!isSynced || !document) {
      return
    }

    const planningYMap = document.getMap('planning')
    initPriority(planningYMap)
  }, [
    isSynced,
    document,
    initPriority
  ])
  return (
    <div className='flex w-full h-full'>
      <NewsValueScoreDropDown
        value={priority as string}
        onChange={(value) => {
          setPriority(value as number)
        }}
        options={Priorities.map(p => {
          return {
            label: p.label,
            value: p.value,
            icon: p.icon && <p.icon color={p.color} />
          }
        })}
      />
      <PlanTitle isSynced={isSynced} document={document} />
    </div>
  )
}
