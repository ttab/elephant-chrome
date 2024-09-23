import { useYObserver } from '@/hooks'
import { NewsValueTimeDropDown } from './NewsValueTimeDropDown'
import { Newsvalue } from '@/components/Newsvalue'

export const EditorHeader = (): JSX.Element => {
  const {
    get: getDuration,
    set: setDuration,
    loading: loadingDuration
  } = useYObserver('meta', 'core/newsvalue/data')

  const {
    get: getEnd,
    set: setEnd
  } = useYObserver('meta', 'core/newsvalue.data')

  return (
    <>
      <Newsvalue />

      <NewsValueTimeDropDown
        duration={typeof getDuration('duration') === 'string'
          ? getDuration('duration') as string
          : undefined}
        end={typeof getEnd('end') === 'string' ? getEnd('end') as string : undefined}
        loading={loadingDuration}
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
