import { ComboBox } from '@/components/ui'
import { Stories } from '@/defaults/stories'
import { useYObserver } from '@/hooks'

export const PlanStory = (): JSX.Element => {
  const { get, set } = useYObserver('planning', 'links.core/story/[0]')

  const selectedOption = Stories.find(s => s.value === get('title'))

  return <ComboBox
    size='xs'
    className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
    options={Stories}
    selectedOption={selectedOption}
    placeholder={selectedOption?.label || 'Story'}
    onSelect={(option) => {
      set(option.payload)
    }}
    />
}
