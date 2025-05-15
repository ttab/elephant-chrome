import { Awareness } from '@/components'
import { useStories, useYValue } from '@/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { ComboBox } from '@ttab/elephant-ui'
import { useRef } from 'react'
import type { FormProps } from './Form/Root'

export const Story = ({ onChange }: FormProps): JSX.Element => {
  const allStories = useStories().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const path = 'links.core/story[0]'
  const [story, setStory] = useYValue<Block | undefined>(path)
  const setFocused = useRef<(value: boolean, path: string) => void>(() => { })
  const selectedOptions = (allStories || []).filter((s) => s.value === story?.uuid)

  return (
    <Awareness ref={setFocused} path={path}>
      <ComboBox
        max={1}
        size='xs'
        modal={true}
        sortOrder='label'
        options={allStories}
        selectedOptions={selectedOptions}
        placeholder={story?.title || 'Lägg till story'}
        onOpenChange={(isOpen: boolean) => {
          setFocused.current(true, isOpen ? path : '')
        }}
        onSelect={(option) => {
          onChange?.(true)
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
