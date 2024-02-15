import { useYObserver } from '@/hooks'
import { Priorities } from '@/defaults'
import { NewsValueTimeDropDown } from './NewsValueTimeDropDown'
import { NewsValueScoreDropDown } from './NewsValueScoreDropDown'
import type * as Y from 'yjs'

export const EditorHeader = ({ yMap }: { yMap: Y.Map<unknown> }): JSX.Element => {
  const [score, setScore] = useYObserver<string>(yMap, 'data.score')
  const [duration, setDuration] = useYObserver<string>(yMap, 'data.duration')
  const [end, setEnd] = useYObserver<string>(yMap, 'data.end')

  return (
    <>
      <NewsValueScoreDropDown
        value={score}
        onChange={(value) => {
          setScore(value)
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
        duration={typeof duration === 'string' ? duration : undefined}
        end={typeof end === 'string' ? end : undefined}
        onChange={(newDuration, newEnd) => {
          setDuration(newDuration)
          setEnd(newEnd)
        }}
      />
    </>
  )
}
