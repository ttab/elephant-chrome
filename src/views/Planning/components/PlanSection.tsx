import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { useSections, useYValue } from '@/hooks'
import { Block } from '@/protos/service'
import { useRef } from 'react'
import * as Y from 'yjs'

export const PlanSection = (): JSX.Element => {
  const allStories = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const [, setStories] = useYValue<Y.Array<unknown>>('links.core/section', {
    createOnEmpty: {
      path: 'links.core/section',
      data: []
    }
  })
  const [section] = useYValue<{ uuid: string, title: string }>('links.core/section[0]')

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOption = allStories.find(s => s.value === section?.uuid)

  return (
    <Awareness name='PlanSection' ref={setFocused}>
      <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={allStories}
        selectedOption={selectedOption}
        placeholder={section?.title || 'Lägg till sektion'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          const newSections = new Y.Array()
          newSections.push([Block.create({
            type: 'core/section',
            rel: 'section',
            uuid: option.value,
            title: option.label
          })])
          setStories(newSections)
        }}
      />
    </Awareness>
  )
}
