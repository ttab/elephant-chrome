import { Priorities } from '@/defaults'
import { useYObserver } from '@/hooks'
import { NewsValueScoreDropDown } from '@/views/Editor/EditorHeader/NewsValueScoreDropDown'
import type * as Y from 'yjs'

export const PlanPriority = ({ yMap }: { yMap?: Y.Map<unknown> }): JSX.Element => {
  const [priority, setPriority] = useYObserver<string>(yMap, 'data.priority')
  return (
    <NewsValueScoreDropDown
      value={priority }
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
  )
}
