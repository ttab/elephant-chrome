import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useSections, useYValue } from '@/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'
import { useRef } from 'react'

export const Section = (): JSX.Element => {
  const allSections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })
  const [section, setSection] = useYValue<Block | undefined>('links.core/section[0]')

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOptions = (allSections || [])?.filter(s => s.value === section?.uuid)

  return (
    <Awareness name='PlanSection' ref={setFocused}>
      <ComboBox
        max={1}
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={allSections}
        selectedOptions={selectedOptions}
        placeholder={section?.title || 'Lägg till sektion'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          setSection(section?.title === option.label
            ? undefined
            : Block.create({
              type: 'core/section',
              rel: 'section',
              uuid: option.value,
              title: option.label
            }))
        }}
      />
    </Awareness>
  )
}
