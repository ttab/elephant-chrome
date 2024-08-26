import { Awareness } from '@/components'
import { useStories, useYValue } from '@/hooks'
import { Block } from '@/protos/service'
import { ComboBox } from '@ttab/elephant-ui'
import { useRef } from 'react'
import * as Y from 'yjs'

export const PlanStory = (): JSX.Element => {
  const allStories = useStories().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const [, setStories] = useYValue<Y.Array<unknown>>('links.core/story', {
    createOnEmpty: {
      path: 'links.core/story',
      data: []
    }
  })
  const [story] = useYValue<{ uuid: string, title: string }>('links.core/story[0]')

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOption = allStories.filter(s => s.value === story?.uuid)

  return (
    <Awareness name='PlanStory' ref={setFocused}>
      <ComboBox
        max={1}
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
          const newStories = new Y.Array()
          if (option.label !== story?.title) {
            newStories.push([Block.create({
              type: 'core/story',
              rel: 'story',
              uuid: option.value,
              title: option.label
            })])
          }
          setStories(newStories)
        }}
      />
    </Awareness>
  )
}
