import { useYObserver } from '@/hooks'
import { Priorities } from '@/defaults'
import { NewsValueTimeDropDown } from './NewsValueTimeDropDown'
import { NewsValueScoreDropDown } from './NewsValueScoreDropDown'

export const EditorHeader = (): JSX.Element => {
  const { get: getScore, set: setScore } = useYObserver('meta.core/newsvalue[0].data')
  const { get: getDuration, set: setDuration } = useYObserver('meta.core/newsvalue/data')
  const { get: getEnd, set: setEnd } = useYObserver('meta.core/newsvalue.data')


  return (
    <>
      <NewsValueScoreDropDown
        value={getScore('score') as string}
        onChange={(value) => {
          setScore(value as string)
        }}
        options={Priorities.map(p => {
          return {
            label: p.label,
            value: p.value,
            icon: p.icon && <p.icon color={p.color} />
          }
        })}
      />

      <NewsValueTimeDropDown
        duration={typeof getDuration('duration') === 'string' ? getDuration('duration') as string : undefined}
        end={typeof getEnd('end') === 'string' ? getEnd('end') as string : undefined}
        onChange={(newDuration, newEnd) => {
          if (newDuration && newEnd) {
            setDuration(newDuration)
            setEnd(newEnd)
          }
        }}
      />
    </>
  )
}
