import { Newsvalues } from '@/defaults'
import { useYObserver } from '@/hooks'
import { NewsValueScoreDropDown } from '@/views/Editor/EditorHeader/NewsValueScoreDropDown'

export const PlanNewsvalue = (): JSX.Element => {
  const { get, set } = useYObserver('meta', 'core/newsvalue[0]')

  return (
    <NewsValueScoreDropDown
      value={get('value') as string}
      onChange={(value) => {
        set(value as string, 'value')
      }}
      options={Newsvalues.map(p => {
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
