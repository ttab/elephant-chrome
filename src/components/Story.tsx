import { Awareness } from '@/components'
import { useStories, useYValue } from '@/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { ComboBox } from '@ttab/elephant-ui'
import { useRef } from 'react'

export const Story = (): JSX.Element => {
  const allStories = useStories().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const [story, setStory] = useYValue<Block | undefined>('links.core/story[0]')

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOptions = (allStories || []).filter(s => s.value === story?.uuid)

  return (
    <Awareness name='Story' ref={setFocused}>
      <ComboBox
        max={1}
        size='xs'
        modal={true}
        sortOrder='label'
        options={allStories}
        selectedOptions={selectedOptions}
        placeholder={story?.title || 'Lägg till story'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          setStory(story?.title === option.label
            ? undefined
            : Block.create({
              type: 'core/story',
              rel: 'story',
              uuid: option.value,
              title: option.label
            }))
        }}
      />
    </Awareness>
  )
}
