import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { useStories, useYValue } from '@/hooks'
import { Block } from '@/protos/service'
import { useRef } from 'react'

export const Story = (): JSX.Element => {
  const allStories = useStories().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const [story, setStory] = useYValue<{ uuid: string, title: string }>('links.core/story[0]')

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOption = allStories.find(s => s.value === story?.uuid)

  return (
    <Awareness name='PlanStory' ref={setFocused}>
      <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={allStories}
        selectedOption={selectedOption}
        placeholder={story?.title || 'Lägg till story'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          const newStory = Block.create({
            type: 'core/story',
            rel: 'story',
            uuid: option.value,
            title: option.label
          })
          setStory(newStory)
        }}
      />
    </Awareness>
  )
}
