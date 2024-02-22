import { ComboBox } from '@/components/ui'
import { Stories } from '@/defaults/stories'
import { useYObserver } from '@/hooks'
import type * as Y from 'yjs'

export const PlanStory = ({ yArray }: { yArray?: Y.Array<unknown> }): JSX.Element => {
  const [story, setStory] = useYObserver<string>(yArray, '[0]')

  const selectedOption = Stories.find(s => s.value === story?.title)

  return <ComboBox
    size='xs'
    className='w-fit text-muted-foreground text-xs font-sans font-normal whitespace-nowrap text-ellipsis px-2'
    options={Stories}
    selectedOption={selectedOption}
    placeholder={selectedOption?.label || 'Add Story'}
    onSelect={(option) => {
      setStory(option.payload)
    }}
    />
}
