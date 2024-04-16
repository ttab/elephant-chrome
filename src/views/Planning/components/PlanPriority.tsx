import { Priorities } from '@/defaults'
import { useYObserver } from '@/hooks'
import { NewsValueScoreDropDown } from '@/views/Editor/EditorHeader/NewsValueScoreDropDown'

export const PlanPriority = (): JSX.Element => {
  const { get, set } = useYObserver('meta', 'core/planning-item[0].data')

  return (
    <NewsValueScoreDropDown
      value={get('priority') as string}
      onChange={(value) => {
        set(value as string, 'priority')
      }}
      options={Priorities.map(p => {
        return {
          label: p.label,
          value: p.value,
          icon: p.icon &&
            <p.icon color={p.color} size={18} strokeWidth={1.75} />
        }
      })}
      />
  )
}
