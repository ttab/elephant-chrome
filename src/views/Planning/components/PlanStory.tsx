import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { Stories } from '@/defaults/stories'
import { useYObserver } from '@/hooks'
import { useRef } from 'react'

export const PlanStory = (): JSX.Element => {
  const { get, set } = useYObserver('planning', 'links.core/story/[0]')
  const setFocused = useRef<(value: boolean) => void>(null)

  const selectedOption = Stories.find(s => s.value === get('title'))

  return (
    <Awareness name='PlanStory' ref={setFocused}>
      <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={Stories}
        selectedOption={selectedOption}
        placeholder={selectedOption?.label || 'Story'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          set(option.payload)
        }}
      />
    </Awareness>
  )
}
