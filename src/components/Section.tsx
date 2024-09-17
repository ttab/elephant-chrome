import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useSections, useYValue } from '@/hooks'
import { Block } from '@/protos/service'
import { useRef } from 'react'
import { Validation } from './Validation'

export const Section = ({ onValidation }: {
  onValidation?: (label: string, value: string | undefined) => boolean
}): JSX.Element => {
  const allSections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })
  const path = 'links.core/section[0]'

  const [section, setSection] = useYValue<Block | undefined>(path)

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOptions = (allSections || [])?.filter(s => s.value === section?.uuid)

  return (
    <Awareness name='PlanSection' ref={setFocused} className='flex flex-col gap-2'>
      <ComboBox
        max={1}
        className='text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
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
      {onValidation &&
      <Validation label='Sektion' path={path} onValidation={onValidation} />
    }
    </Awareness>
  )
}
